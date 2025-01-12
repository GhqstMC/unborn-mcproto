import { Transform, TransformCallback } from "stream"
import { encodeVarInt, decodeVarInt } from "./varint"
import * as zlib from "zlib"

export class Writer extends Transform {
    compressionThreshold = -1

    _transform(chunk: Buffer, _enc: string, callback: TransformCallback) {
        if (this.compressionThreshold == -1) {
            this.push(Buffer.concat([encodeVarInt(chunk.length), chunk]))
        } else {
            if (chunk.length < this.compressionThreshold) {
                this.push(Buffer.concat([
                    encodeVarInt(chunk.length + 1),
                    encodeVarInt(0), chunk
                ]))
            } else {
                return zlib.deflate(chunk, (error, buffer) => {
                    if (error) return callback(error)
                    const len = encodeVarInt(chunk.length)
                    const packetLen = encodeVarInt(len.length + buffer.length)
                    this.push(Buffer.concat([packetLen, len, buffer]))
                    callback()
                })
            }
        }
        callback()
    }
}

export class Reader extends Transform {
    compressionThreshold = -1

    private buffer = Buffer.alloc(0)
    private transforming = false
    private flushCb?: () => void

    async _transform(chunk: Buffer, _enc: string, callback: TransformCallback) {
        this.buffer = Buffer.concat([this.buffer, chunk])
        this.transforming = true

        let offset = 0
        let length: number

        while (true) {
            const packetStart = offset

            try {
                [length, offset] = decodeVarInt(this.buffer, offset)
            } catch (err) {
                break
            }

            if (offset + length > this.buffer.length) {
                offset = packetStart
                break
            }

            try {
                if (this.compressionThreshold == -1) {
                    this.push(this.buffer.slice(offset, offset + length))
                } else {
                    const [len, off] = decodeVarInt(this.buffer, offset)
                    const buffer = this.buffer.slice(off, offset + length)

                    if (len == 0) {
                        this.push(buffer)
                    } else {
                        this.push(await new Promise((resolve, reject) => {
                            zlib.inflate(buffer, {
                                finishFlush: zlib.constants.Z_SYNC_FLUSH
                            }, (error, buffer) => {
                                if (error) reject(error)
                                else resolve(buffer)
                            })
                        }))
                    }
                }
            } catch (error) {
                return this.destroy(error as Error | undefined)
            }
            offset += length
            await Promise.resolve()
        }

        this.buffer = this.buffer.slice(offset)
        this.flushCb && this.flushCb()
        this.transforming = false
        callback()
    }

    flush(callback: () => void) {
        if (this.transforming) {
            this.flushCb = callback
        } else {
            callback()
        }
    }
}

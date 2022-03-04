import { fetch, FetchResultTypes, FetchMethods } from '@sapphire/fetch';
import * as querystring from "querystring"

export async function joinSession(accessToken: string, selectedProfile: string, serverId: string) {
    try {
        const responseData = await fetch(
            'https://sessionserver.mojang.com/session/minecraft/join',
            {
                method: FetchMethods.Post,
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    accessToken, selectedProfile, serverId
                })
            },
            FetchResultTypes.JSON
        )
        return true
    } catch(e) {
        return false
    }
}

export async function hasJoinedSession(username: string, serverId: string, ip?: string) {
    try {
        const data = await fetch("https://sessionserver.mojang.com/session/minecraft/hasJoined?"
        + querystring.stringify({ username, serverId }), FetchResultTypes.JSON)
        return true
    } catch(e) {
        return false
    }
    
}

export function mcPublicKeyToPem(buffer: Buffer) {
    let pem = "-----BEGIN PUBLIC KEY-----\n"
    let bpk = buffer.toString("base64")
    const maxLineLength = 65
    while (bpk.length > 0) {
        pem += bpk.substring(0, maxLineLength) + "\n"
        bpk = bpk.substring(maxLineLength)
    }
    return pem + "-----END PUBLIC KEY-----\n"
}

export function mcHexDigest(hash: Buffer) {
    const isNegative = hash.readInt8(0) < 0
    if (isNegative) performTwosCompliment(hash)
    let digest = hash.toString("hex")
    digest = digest.replace(/^0+/g, "")
    if (isNegative) digest = "-" + digest
    return digest
}

function performTwosCompliment(buffer: Buffer) {
    let carry = true, newByte: number, value: number
    for (let i = buffer.length - 1; i >= 0; --i) {
        value = buffer.readUInt8(i)
        newByte = ~value & 0xff
        if (carry) carry = newByte == 0xff, buffer.writeUInt8(newByte + 1, i)
        else buffer.writeUInt8(newByte, i)
    }
}

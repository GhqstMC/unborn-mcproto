# Unborn Minecraft Protocol

[![npm](https://img.shields.io/npm/v/unborn-mcproto.svg)](https://www.npmjs.com/package/unborn-mcproto)
[![downloads](https://img.shields.io/npm/dm/unborn-mcproto.svg)](https://www.npmjs.com/package/unborn-mcproto)
[![license](https://img.shields.io/npm/l/unborn-mcproto.svg)](https://github.com/GhqstMC/unborn-mcproto/blob/master/LICENSE)

`unborn-mcproto` builds on `mcproto`, a small and lightweight implementation of the Minecraft protocol. It is designed for Hypixel 1.8.9 proxies and features PrismarineJS tools and functional niceties for deserializing and serializing packets in a proxy context with tight integration.

If you're looking for a Hypixel proxy, I highly recommend [Lilith](https://discord.gg/lilith).

## Features

- Prismarine NBT
- Tools for reading rest buffers, optional properties, simple arrays, and arrays of objects in a functional way

## Examples

### Server list ping

```js
const { Client, PacketWriter, State } = require("unborn-mcproto")

const host = "play.hivemc.com", port = 25565

const client = await Client.connect(host, port)

client.send(new PacketWriter(0x0).writeVarInt(404)
    .writeString(host).writeUInt16(port)
    .writeVarInt(State.Status))

client.send(new PacketWriter(0x0))

const response = await client.nextPacket(0x0)
console.log(response.readJSON())

client.end()
```

### Client

```js
const { Client, PacketWriter, State } = require("unborn-mcproto")

const host = "localhost", port = 25565, username = "Notch"

const client = await Client.connect(host, port)

client.send(new PacketWriter(0x0).writeVarInt(340)
    .writeString(host).writeUInt16(port).writeVarInt(State.Login))

// Send login start
client.send(new PacketWriter(0x0).writeString(username))

const listener = client.onPacket(0x0, packet => {
    console.log(packet.readJSON())
})

// The server can request encryption and compression which will be handled
// in the background, so just wait until login success.
await client.nextPacket(0x2, false)
listener.dispose()

client.on("packet", packet => {
    if (packet.id == 0xf) console.log(packet.readJSON())
})

// Send chat message
client.send(new PacketWriter(0x2).writeString("Hello"))
```

For online servers, you must specify an accessToken and profile ID:

```js
Client.connect("localhost", 25565, {
    profile: "<id>", accessToken: "<token>"
})
```

More examples can be found in the repository's `examples` folder.

## Events and errors

`mcproto` uses it's own tiny event emitter class and provides different methods
to handle packet, socket and error events.

Since a lot of the API is promise based, errors that happen during the lifetime
a promise will result in the promise being rejected.

Errors that happen outside of async method calls should be handled with a `error`
event handler on the connection instance.

```js
const listener = client.on("error", console.error)

// listeners can be removed with:
listener.dispose()
// or
client.off("error", console.error)
```

The server class does allow to return a `Promise` in the client handler and
it will forward errors to the server's event emitter.

```js
const server = new Server(async client => {
    // errors thrown inside here won't cause a crash but might
    // show warnings if not handled.
    throw "error"
})
server.on("error", console.error)
server.listen()
```

```js
client.on("packet", packet => {
    // make sure to catch errors inside event handlers
})
```

For details about packets and general information about the protocol,
https://wiki.vg/Protocol is a great reference.

## Other Projects

- [Lilith](https://discord.gg/lilith). An easy to use Hypixel proxy for the general public that will soon use `unborn-mcproto`

- [prismarine-proxy](https://github.com/PrismarineJS/prismarine-proxy). A higher level, generalized alternative library. Provides Protodef for much easier packet parsing.
- [minecraft-proxy-handler](https://github.com/u9g/minecraft-proxy-handler). An alternative to prismarine-proxy with less documentation.
- [prismarine-chat](https://github.com/PrismarineJS/prismarine-chat). A parser for a minecraft chat message
- [prismarine-nbt](https://github.com/PrismarineJS/prismarine-nbt). Converts
  chat components into raw / ansi formatted text.

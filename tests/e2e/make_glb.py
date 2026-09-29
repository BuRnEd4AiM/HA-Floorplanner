import json, struct
pos = struct.pack('<9f', 0,0,0, 1,0,0, 0,1,0)
gltf = {"asset":{"version":"2.0"},"scene":0,"scenes":[{"nodes":[0]}],"nodes":[{"mesh":0}],
 "meshes":[{"primitives":[{"attributes":{"POSITION":0}}]}],
 "buffers":[{"byteLength":len(pos)}],
 "bufferViews":[{"buffer":0,"byteOffset":0,"byteLength":len(pos),"target":34962}],
 "accessors":[{"bufferView":0,"componentType":5126,"count":3,"type":"VEC3","min":[0,0,0],"max":[1,1,0]}]}
j = json.dumps(gltf).encode(); j += b' ' * ((4 - len(j) % 4) % 4)
b = pos + b'\0' * ((4 - len(pos) % 4) % 4)
out = b'glTF' + struct.pack('<II', 2, 12 + 8 + len(j) + 8 + len(b))
out += struct.pack('<I4s', len(j), b'JSON') + j + struct.pack('<I4s', len(b), b'BIN\0') + b
open(__import__('pathlib').Path(__file__).parent / 'tri.glb','wb').write(out)

# License notice

**3D Floorplan for Home Assistant**
Copyright (C) 2026 BuRnEd4AiM and the contributors of 3D Floorplan

This program is free software: you can redistribute it and/or modify it under the terms of the GNU General Public License as published by the Free Software Foundation, either version 3 of the License, or (at your option) any later version.

This program is distributed in the hope that it will be useful, but WITHOUT ANY WARRANTY; without even the implied warranty of MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE. See the GNU General Public License for more details.

You should have received a copy of the GNU General Public License along with this program (the file [LICENSE](LICENSE)). If not, see <https://www.gnu.org/licenses/>.

SPDX-License-Identifier: `GPL-3.0-or-later`

## In plain words

- You may use 3D Floorplan for free, at home or anywhere else, read the code, change it and share it.
- If you **share** a changed version, or build its code into your own project and share that, the whole result must be under the GPL as well, with its source code open, and it must say that you changed it.
- The copyright lines (this file, the [LICENSE](LICENSE) and the notices of the bundled libraries below) must stay in every copy.

## Before the GPL: versions up to 4.61.0 were MIT

Until the change of license on 2026-11-03, 3D Floorplan was released under the MIT License: **every version up to and including 4.61.0**, and everything published in this repository before that change, stays available under the MIT License below. Every later version is GPL-3.0-or-later.

Code that contributors gave under the MIT License before the change keeps this MIT notice; each contributor keeps the copyright of their own contribution.

```
MIT License

Copyright (c) 2026 BuRnEd4AiM

Permission is hereby granted, free of charge, to any person obtaining a copy
of this software and associated documentation files (the "Software"), to deal
in the Software without restriction, including without limitation the rights
to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
copies of the Software, and to permit persons to whom the Software is
furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in all
copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
SOFTWARE.
```

## Bundled third-party parts

These keep their own licenses (all of them may be shipped inside a GPL-3.0 program):

| Part | License | Notice |
|---|---|---|
| [three.js](https://threejs.org) | MIT | [floorplan3d/rootfs/app/static/vendor/LICENSE-three.txt](floorplan3d/rootfs/app/static/vendor/LICENSE-three.txt) |
| [polygon-clipping](https://github.com/mfogel/polygon-clipping) (with splaytree, robust-predicates) | MIT (splaytree MIT, robust-predicates Unlicense) | [floorplan3d/rootfs/app/static/vendor/LICENSE-polygon-clipping.txt](floorplan3d/rootfs/app/static/vendor/LICENSE-polygon-clipping.txt) |
| [hls.js](https://github.com/video-dev/hls.js) (light build) | Apache License 2.0 | [floorplan3d/rootfs/app/static/vendor/LICENSE-hls.txt](floorplan3d/rootfs/app/static/vendor/LICENSE-hls.txt) |
| 3D models: Furniture Kit by [Kenney](https://www.kenney.nl) | CC0 1.0 | [floorplan3d/rootfs/app/library/CREDITS.md](floorplan3d/rootfs/app/library/CREDITS.md) |

A new bundled library must be compatible with GPL-3.0 (for example MIT, BSD, Apache-2.0, LGPL, GPL-3.0; **not** GPL-2.0-only) and gets a row here.

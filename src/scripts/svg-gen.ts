import * as fs from 'fs';
import * as util from 'util';

import fetch from 'node-fetch';
import * as opentype from 'opentype.js';

import { getGoogleFontsList } from '../services/GoogleFontsService';

const writeFile = util.promisify(fs.writeFile);

(async function () {
  const googleFonts = await getGoogleFontsList();

  googleFonts.forEach(async (googleFont) => {
    try {
      const res = await fetch(googleFont.fileURL);
      const contents = await res.arrayBuffer();

      const font = opentype.parse(contents);

      const svgText = googleFont.fullName.replace(/\-/g, ' ');
      const openTypePath = font.getPath(svgText, 0, 100, 72);
      const { x1, x2, y1, y2 }: any = openTypePath.getBoundingBox();

      const svgPath = openTypePath.toSVG(2);
      const svgViewBox = [x1, y1, Math.abs(x1 - x2), Math.abs(y1 - y2)].join(' ');

      const svgFileContents = `
        <svg xmlns="http://www.w3.org/2000/svg" viewBox="${svgViewBox}">
          ${svgPath}
        </svg>
      `.replace(/^\s+|\n/gm, '');

      await writeFile(
        `./dist/${googleFont.fullName}.svg`,
        svgFileContents
      );

    } catch (error) {
      console.log(googleFont);
      console.log(error);
    }
  });
})();

process.on('unhandledRejection', (reason) => {
  console.log('Unhandled Rejection at:', reason.stack || reason);
  process.exit(1);
});

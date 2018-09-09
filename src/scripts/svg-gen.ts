import * as fs from 'fs';
import * as util from 'util';

import fetch from 'node-fetch';
import * as opentype from 'opentype.js';

import { getGoogleFontsList } from '../services/GoogleFontsService';

const writeFile = util.promisify(fs.writeFile);

(async function () {
  const googleFonts = await getGoogleFontsList();

  let count = { done: 0 };
  console.log('total fonts', googleFonts.length);

  googleFonts.forEach(async (googleFont) => {
    try {
      const res = await fetch(googleFont.fileURL);
      const contents = await res.arrayBuffer();
      const openTypeFont = opentype.parse(contents);

      const fontText = googleFont.family.replace(/\-/g, ' ');
      const openTypePath = openTypeFont.getPath(fontText, 0, 0, 10);
      const { x1, x2, y1, y2 }: any = openTypePath.getBoundingBox();

      const svgViewBox = `${x1} ${y1} ${Math.abs(x1 - x2)} ${Math.abs(y1 - y2)}`;

      const svgFileContents = `
        <svg xmlns="http://www.w3.org/2000/svg" viewBox="${svgViewBox}">
          ${openTypePath.toSVG(2)}
        </svg>
      `.replace(/^\s+|\n/gm, '');

      await writeFile(
        `./dist/${googleFont.fullName}.svg`,
        svgFileContents
      );

      console.log('wrote %s progress %s%',
        googleFont.fullName,
        Math.round(++count.done * 100 / googleFonts.length)
      );

    } catch (error) {
      console.log(googleFont);
      console.log(error);
      ++count.done;
    }
  });
})();

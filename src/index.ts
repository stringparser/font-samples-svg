import * as fs from 'fs';
import * as util from 'util';
import * as opentype from 'opentype.js';
import * as GetGoogleFonts from 'get-google-fonts';

const readDir = util.promisify(fs.readdir);
const writeFile = util.promisify(fs.writeFile);
const outputDir = './build';

type fontResolveValue = {
  font: opentype.Font;
  variant: string;
  basename: string;
};

async function loadFonts(fontName: string): Promise<fontResolveValue[]> {
  type Reject = (error: Error) => void;
  type Resolve = (fontValue: fontResolveValue[]) => void;

  return new Promise(async function (resolve: Resolve, reject: Reject) {
    const fontURL = `https://fonts.googleapis.com/css?family=${fontName.replace(/\s+/g, '+')}:300,300i,400,400i,600,600i,700,700i,800,800i&amp;subset=cyrillic,cyrillic-ext,greek,greek-ext,latin-ext,vietnamese`;

    await new GetGoogleFonts().download(fontURL, {
      outputDir,
      userAgent: 'curl' // opentype does not support woff2
    });

    const fontRE = new RegExp(`^${fontName.replace(/\s+/g, '_')}[^.]+\.(woff|ttf|otf)`, 'i');
    const fontPaths = await readDir(outputDir);
    const fontVariants = fontPaths.filter(el => fontRE.test(el));

    const fonts: fontResolveValue[] = [];

    fontVariants.forEach((basename) => {
      opentype.load(`${outputDir}/${basename}`, (error, font) => {
        if (error) {
          return reject(error);
        }

        fonts.push({
          font,
          basename,
          variant: (basename.split('-')[0] ||  '').replace(/[_]/g, ' '),
        });

        if (fonts.length === fontVariants.length) {
          resolve(fonts);
        }
      });
    })
  });
}

(async function (fontName) {
  const fonts = await loadFonts(fontName);

  fonts.forEach(async ({ font, variant, basename }) => {
    const path = font.getPath(variant, 0, 100, 72);
    const svgFileName = `./dist/${basename.replace(/\.[^.]+$/, '')}.svg`;
    const { x1, x2, y1, y2 }: any = path.getBoundingBox();

    const svgPath = path.toSVG(2);
    const svgViewBox = [
      x1,
      y1,
      Math.abs(x1 - x2),
      Math.abs(y1 - y2),
    ].join(' ');

    const svgFileContents = `
      <svg xmlns="http://www.w3.org/2000/svg" viewBox="${svgViewBox}">
        ${svgPath}
      </svg>
    `.replace(/^\s+/gm, '');

    await writeFile(svgFileName, svgFileContents);
  });
})('Noto Serif JP');

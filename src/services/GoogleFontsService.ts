import * as path from 'path';
import fetch from 'node-fetch';

import { GOOGLE_FONTS_API_KEY } from '../../.env/config';
import { FONT_WEIGHT_NAMES, GOOGLE_FONTS_API } from './constants';

function getWeightName(weight: string) {
  return FONT_WEIGHT_NAMES[weight] ||  weight;
}

type GoogleFontsListBody = {
  kind: string;
  items: {
    kind: string;
    files: {
      [key: string]: string;
    };
    family: string;
    version: string;
    subsets: string[];
    category: string;
    variants: string[];
    lastModified: string;
  }[];
};

type FontItem = {
  family: string;
  fileURL: string;
  fullName: string;
  pathname: string;
};

export async function getGoogleFontsList(key = GOOGLE_FONTS_API_KEY): Promise<FontItem[]> {
  const res = await fetch(`${GOOGLE_FONTS_API}?key=${key}&sort=popularity`);
  const body: GoogleFontsListBody = await res.json();

  return body.items.slice(0, 100).reduce((acc, { files, family }) => {
    Object.keys(files).forEach((key) => {
      const fileURL = files[key];
      const [weight, decoration] = /^(\d*)(\S*)$/.exec(key).slice(1);
      const fullName = [family, getWeightName(weight), decoration]
        .filter(v => v)
        .join('-')
        .replace(/\s+/g, '-')
      ;

      const extname = fileURL.split('.').pop();
      const pathname = path.resolve(`./build/${fullName}.${extname}`);

      acc.push({
        family,
        fileURL,
        pathname,
        fullName,
      });
    });

    return acc;
  }, []);
}

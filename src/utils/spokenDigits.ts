const SPOKEN: Record<string, string> = {
  zero: '0', oh: '0', صفر: '0', زيرو: '0',
  one: '1', واحد: '1', واحده: '1', احد: '1', ون: '1', وان: '1',
  two: '2', اثنين: '2', اتنين: '2', اثنان: '2', اتنان: '2', ثنين: '2', تو: '2',
  three: '3', ثلاثه: '3', تلاته: '3', ثلاث: '3', تلات: '3', ثري: '3',
  four: '4', اربعه: '4', اربع: '4', فور: '4',
  five: '5', خمسه: '5', خمس: '5', فايف: '5',
  six: '6', سته: '6', ست: '6', سيكس: '6',
  seven: '7', سبعه: '7', سبع: '7', سفن: '7',
  eight: '8', ثمانيه: '8', تمانيه: '8', ثمان: '8', تمان: '8', ايت: '8',
  nine: '9', تسعه: '9', تسع: '9', ناين: '9'
};

const normalize = (token: string) =>
  token
    .toLowerCase()
    .replace(/[أإآ]/g, 'ا')
    .replace(/ة/g, 'ه')
    .replace(/ى/g, 'ي')
    .replace(/[ً-ْ]/g, '');

const spokenDigit = (token: string): string | undefined => {
  const key = normalize(token);
  return SPOKEN[key] ?? (key.startsWith('و') ? SPOKEN[key.slice(1)] : undefined);
};

/** Digits written as numerals, or spoken one by one in Arabic or English. */
export function digitsOf(text: string): string {
  const tokens = text.match(/[0-9٠-٩]+|[A-Za-z]+|[\u0600-\u06FF]+/g) ?? [];
  return tokens.map(token => {
    if (/[0-9٠-٩]/.test(token)) return token.replace(/[٠-٩]/g, d => String('٠١٢٣٤٥٦٧٨٩'.indexOf(d)));
    return spokenDigit(token) ?? '';
  }).join('');
}

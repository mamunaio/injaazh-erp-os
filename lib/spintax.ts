export function parseSpintax(text: string): string {
  if (!text) return text;
  
  // Use a regex that finds innermost { ... } blocks
  const spintaxRegex = /\{([^{}]+)\}/g;
  
  let result = text;
  while (spintaxRegex.test(result)) {
    result = result.replace(spintaxRegex, (match, contents) => {
      const options = contents.split('|');
      return options[Math.floor(Math.random() * options.length)];
    });
  }
  
  return result;
}

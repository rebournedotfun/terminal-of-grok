export default function replaceURLs(text) {
  let urlRegex = /https?:\/\/[^\s]+/g;
  return text.replace(urlRegex, (url) => '<a href="' + url + '">' + url + '</a>');
}

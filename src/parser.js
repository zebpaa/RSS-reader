import uniqueId from 'lodash/uniqueId.js';

const parse = (data) => {
  const parser = new DOMParser();
  const doc = parser.parseFromString(data.contents, 'application/xml');
  const parserError = doc.querySelector('parsererror');

  if (parserError) {
    throw new Error('errors.urlIsNotRSS');
  }

  const id = uniqueId();

  const feed = {
    url: doc.querySelector('link').textContent,
    title: doc.querySelector('title').textContent,
    description: doc.querySelector('description').textContent,
    id,
  };

  const posts = [];

  const items = doc.querySelectorAll('item');
  items.forEach((item) => {
    const post = {
      title: item.querySelector('title').textContent,
      url: item.querySelector('link').textContent,
      description: item.querySelector('description').textContent,
      feedId: id,
      id: uniqueId(),
    };

    posts.push(post);
  });
  return { feed, posts };
};

export default parse;

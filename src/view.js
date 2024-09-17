import onChange from 'on-change';

export default (elements, i18n, state) => {
  const {
    form, input, feedback, posts, feeds, modal, submitButton,
  } = elements;

  const fillModalInfo = () => {
    const {
      title, description, href, id,
    } = state.modal;

    const postEl = document.querySelector(`[data-id='${id}']`);
    postEl.classList.remove('fw-bold');
    postEl.classList.add('fw-normal', 'link-secondary');

    const modalTitle = modal.querySelector('.modal-title');
    const modalLink = modal.querySelector('a[role="button"]');
    const modalDescription = modal.querySelector('.modal-body');

    modalTitle.textContent = title;
    modalDescription.textContent = description;
    modalLink.href = href;
    modalLink.id = id;
  };

  const createContainer = (container) => {
    const newContainer = document.createElement('div');
    container.replaceChildren(newContainer);

    const card = document.createElement('div');
    card.classList.add('card', 'border-0');
    newContainer.append(card);

    const cardBody = document.createElement('div');
    cardBody.classList.add('card-body');
    card.append(cardBody);

    const ul = document.createElement('ul');
    ul.classList.add('list-group', 'border-0', 'rounded-0');
    card.append(ul);
    return { ul, cardBody };
  };

  const createTitle = (titleName, cardBody) => {
    const h2 = document.createElement('h2');
    h2.classList.add('card-title', 'h4');
    h2.textContent = titleName === 'feeds' ? i18n.t(titleName) : i18n.t(`${titleName}.title`);
    cardBody.append(h2);
  };

  const createFeeds = () => {
    const { ul, cardBody } = createContainer(feeds);
    createTitle('feeds', cardBody);

    state.contents.feeds.forEach((feed) => {
      const li = document.createElement('li');
      li.classList.add('list-group-item', 'border-0', 'border-end-0');
      ul.append(li);

      const h3 = document.createElement('h3');
      h3.classList.add('h6', 'm-0');
      h3.textContent = feed.title;
      li.append(h3);

      const p = document.createElement('p');
      p.classList.add('m-0', 'small', 'text-black-50');
      p.textContent = feed.description;
      li.append(p);
    });
  };

  const createPosts = () => {
    const { ul, cardBody } = createContainer(posts);
    createTitle('posts', cardBody);

    state.contents.posts.forEach((post) => {
      const li = document.createElement('li');
      li.classList.add(
        'list-group-item',
        'd-flex',
        'justify-content-between',
        'align-items-start',
        'border-0',
        'border-end-0',
      );
      ul.append(li);

      const a = document.createElement('a');
      a.href = post.url;
      a.setAttribute('data-id', post.id);
      a.target = '_blank';
      a.rel = 'noopener noreferrer';
      a.textContent = post.title;
      if (state.ui.seenPosts.includes(post.id)) {
        a.classList.add('fw-normal', 'link-secondary');
      } else {
        a.classList.add('fw-bold');
      }
      li.append(a);

      const button = document.createElement('button');
      button.type = 'button';
      button.classList.add('btn', 'btn-outline-primary', 'btn-sm');
      button.setAttribute('data-id', post.id);
      button.setAttribute('data-bs-toggle', 'modal');
      button.setAttribute('data-bs-target', '#modal');
      button.textContent = i18n.t('posts.button');
      li.append(button);
    });
  };

  const handleErrors = () => {
    if (!state.form.errors) {
      input.classList.remove('is-invalid');
      feedback.textContent = '';
    } else {
      input.classList.add('is-invalid');
      const errorText = state.form.errors;
      feedback.classList.add('text-danger');
      feedback.textContent = i18n.t(errorText);
    }
  };

  const hangleSuccess = () => {
    input.classList.remove('is-invalid');
    feedback.classList.add('text-success');
    feedback.classList.remove('text-danger');
    feedback.textContent = i18n.t('success');
    form.reset();
    input.focus();
  };

  const render = (path, value) => {
    switch (path) {
      case 'status':
        if (value === 'loading') {
          submitButton.disabled = true;
          input.disabled = true;
        }
        if (value === 'filling') {
          submitButton.disabled = false;
          input.disabled = false;
        }
        break;
      case 'contents.feeds':
        createFeeds();
        break;
      case 'contents.posts':
      case 'ui.seenPosts':
        createPosts();
        break;
      case 'form.errors':
        handleErrors();
        break;
      case 'loadedFeeds':
        hangleSuccess();
        break;
      case 'modal':
        fillModalInfo();
        break;
      default:
        console.log('Что-то пошло не так! path: ', path);
        break;
    }
  };

  const watchedState = onChange(state, render);

  return watchedState;
};

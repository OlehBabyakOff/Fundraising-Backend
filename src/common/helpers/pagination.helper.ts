export function pagination(query) {
  const _page = query.page ? Number(query.page) : 1;
  const _count = query.count ? Number(query.count) : 10;

  const page = Number.isNaN(_page) || _page < 1 ? 1 : _page;

  const count = Number.isNaN(_count) || _count < 1 ? 10 : _count;

  const skip = (page - 1) * count;

  return { count, page, skip };
}

export function search(search) {
  if (search && typeof search === 'string') {
    const searchText = search;

    const replacedTxt = searchText.replace(/ +$/, '');

    return new RegExp(`.*${replacedTxt}.*`, 'ig');
  }

  return '';
}

export function sort(sortObj, sortedFieldsType = []) {
  const parsedSort = {};
  const sortValue = +sortObj.value === 1 ? 1 : -1;
  let sortField = sortObj.field;

  if (sortedFieldsType.indexOf(sortField) === -1) {
    sortField = 'createdAt';
  }

  parsedSort[sortField] = sortValue;

  return parsedSort;
}

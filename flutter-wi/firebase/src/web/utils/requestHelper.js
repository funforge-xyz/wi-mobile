const prepareQueryParams = (queryParams) => {
  const {
    limit, offset, sortOrder, ...rest
  } = queryParams;

  const params = {
    ...(limit !== undefined && limit !== null ? {
      limit,
    } : {}),
    ...(offset !== undefined && offset !== null ? {
      offset,
    } : {}),
    ...(sortOrder !== undefined && sortOrder !== null ? {
      sortOrder,
    } : {}),
  };

  return {
    search: rest,
    ...(params ? { params } : {}),
  };
};

// eslint-disable-next-line import/prefer-default-export
export { prepareQueryParams };

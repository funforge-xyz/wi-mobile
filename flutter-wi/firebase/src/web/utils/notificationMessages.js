import parse from '../../helpers/parser';

const singleCommentMsg = (item) => parse('%s commented on your feed', item);
const singleLikeMsg = (item) => parse('%s liked on your feed', item);

const inactiveUserMsg = () => 'Check what is happening around you!';


export {
  singleCommentMsg,
  singleLikeMsg,
  inactiveUserMsg,
};

import { Op, QueryTypes } from 'sequelize';
import config from '../config';

// TODO: Add support for OR in where clause.

const handleResponse = (data) => {
  if (!data) {
    return data;
  }

  if (data instanceof Array && data != null && !Object.prototype.hasOwnProperty.call(data, 'count')) {
    const resp = data.map((item) => item.get({ plain: true }));
    return resp;
  }
  if (data && Object.prototype.hasOwnProperty.call(data, 'count') && data.rows instanceof Array) {
    const resp = {};
    resp.resultList = data.rows.map((item) => item.get({ plain: true }));
    resp.totalCount = data.count;
    return resp;
  }

  if (data != null && data instanceof Object && !Object.prototype.hasOwnProperty.call(data, 'count')) {
    return data.get({ plain: true });
  }

  throw new Error('Unable to handle sequalize data');
};

const transformOperator = (operator) => {
  switch (operator) {
    case '=':
      return Op.eq;
    case '!=': 
      return Op.ne;
    case 'like':
      return Op.like;
    case 'iLike':
      return Op.iLike;
    case 'in':
      return Op.in;
    case '!in':
      return Op.notIn;
    case '<=':
      return Op.lte;
    case '>=': 
      return Op.gte;
    default:
      throw new Error(
        `Operator: ${operator} is not presented in the list of supported operators.`
      );
  }
};

const transformOperatorValue = value => 
  value === '' || value === 'null' ? null : value;


const createWhere = (params, options) => {
  const whereObj = {};
  params.forEach((param) => {
    if (param.value && param.prop && param.operator) {
      const whereItem = {};
      whereItem[transformOperator(param.operator)] = transformOperatorValue(param.value);

      if (whereObj[param.prop]) {
        whereObj[param.prop] = { ...whereObj[param.prop], ...whereItem };
      } else {
        whereObj[param.prop] = whereItem;
      }
    }
  });

  return whereObj;
};

const createWhereFromSearch = (searchObj) => 
  searchObj.search ? createWhere(searchObj.search, searchObj.params) : {};

const createOrder = (orderItem) => {
  const sortArray = orderItem.split(',');
  const order = sortArray.map((p) => {
    const item = p.trim().split(' ');
    return item;
  });
  return order;
};

const buildComplexInclude = (includeParams, model, models) => {
  const includeList = [];
  includeParams.forEach((include) => {
    const inc = {
      model: models[model.aliases()[include.include].model],
      as: model.aliases()[include.include].alias
    };

    if (include.search !== undefined) {
      inc.where = createWhere(include.search);
    }

    if (include.required !== undefined) {
      inc.required = include.required;
    }

    if (include.duplicating !== undefined) {
      inc.duplicating = include.duplicating;
    }

    if (include.attributes !== undefined) {
      inc.attributes = include.attributes;
    }

    if (include.complexInclude !== undefined) {
      inc.include = buildComplexInclude(include.complexInclude, inc.model, models);
    }

    if (include.dataLimit !== undefined) {
      inc.limit = include.dataLimit;
    }

    if (include.dataSort !== undefined) {
      inc.order = createOrder(include.dataSort);
    }

    includeList.push(inc);
  });

  return includeList;
};

const createComplexInclude = (searchObj, model, models) => {
  if (searchObj?.params?.complexInclude) {
    const includeList = buildComplexInclude(searchObj.params.complexInclude, model, models);
    return includeList;
  }
  return [];
};

const createInclude = (searchObj, model, models) => {
  if (searchObj.params && searchObj.params.include) {
    const includeList = [];
    const subIncludeList = [];
    const thirdSubIncludeList = [];

    searchObj.params.include.forEach((include) => {
      if (include.indexOf('.') < 0) {
        includeList.push(include);
      } else if (include.indexOf('.') >= 0 && include.split('.').length === 2) {
        subIncludeList.push(include);
      } else {
        thirdSubIncludeList.push(include);
      }
    });

    const includeStructure = [];
    includeList.forEach((includeItem) => {
      const obj = {
        model: models[model.aliases()[includeItem].model],
        as: model.aliases()[includeItem].alias
      };

      if (subIncludeList.length > 0) {
        const subResources = subIncludeList.filter((p) => p.startsWith(`${includeItem}.`));
        if (subResources.length > 0) {
          obj.include = [];
          subResources.forEach((subResource) => {
            const res = subResource.split('.')[1];
            const subObj = {
              model: models[obj.model.aliases()[res].model],
              as: obj.model.aliases()[res].alias
            };
            if (thirdSubIncludeList.length > 0) {
              const thirdSubResources = thirdSubIncludeList.filter((p) => p.startsWith(`${subResource}.`));
              if (thirdSubResources.length > 0) {
                subObj.include = [];
                thirdSubResources.forEach((thirSubResource) => {
                  const thirdRes = thirSubResource.split('.')[2];
                  const thirdSubObj = {
                    model: models[subObj.model.aliases()[thirdRes].model],
                    as: subObj.model.aliases()[thirdRes].alias
                  };
                  subObj.include.push(thirdSubObj);
                });
              }
            }

            obj.include.push(subObj);
          });
        }
      }

      includeStructure.push(obj);
    });
    return includeStructure;
  }

  return [];
};

const beginTransaction = async (obj) => {
  const o = obj;
  if (o.context.transaction == null) {
    const tran = await o.sequelize.transaction();
    o.context.transaction = tran;
    await o.sequelize.query(`SET idle_in_transaction_session_timeout=${config.pgtransactiontimeout}`, { transaction: tran });
    return true;
  }
  return false;
};

const rollbackTransaction = async (obj) => {
  const o = obj;
  if (o.context.transaction != null) {
    await o.context.transaction.rollback();
    o.context.transaction = null;
  }
};

const commitTransaction = async (obj) => {
  const o = obj;
  if (o.context.transaction != null) {
    await o.context.transaction.commit();
    o.context.transaction = null;
  }
};

const createAttributes = (searchObj) => {
  let attributes = [];

  if (searchObj?.params?.columns) {
    attributes = [...searchObj.params.columns.replace(' ', '').split(',')];
  }

  if (searchObj.aggregationParams) {
    attributes = [...attributes, ...searchObj.aggregationParams
      .map((item) => [sequelize.fn(item.function, sequelize.col(item.column)), item.as])];
  }

  return attributes.length > 0 ? attributes : {};
};

class SequelizeRepository {
  constructor(options) {
    this.model = options.model;
    this.context = options.context;
    this.sequelize = options.sequelize;
    this.models = options.models;
  }

  async useTransaction(func) {
    let tranOwner;
    try {
      tranOwner = await beginTransaction(this);
      const data = await func();
      if (tranOwner === true) {
        await commitTransaction(this);
      }
      return data;
    } catch (error) {
      if (tranOwner === true) {
        await rollbackTransaction(this);
      }
      throw (error);
    }
  }

  async findOne(searchObj) {
    if (searchObj?.search) {
      const data = await this.model.findOne({
        where: createWhereFromSearch(searchObj),
        transaction: this.context.transaction,
        include: [
          ...createComplexInclude(searchObj, this.model, this.models),
          ...createInclude(searchObj, this.model, this.models)
        ]
      });

      const resp = handleResponse(data);
      return resp;
    }
  }

  async findMany(searchObj) {
    // searchObj: { search: {}, params: {} }
    const query = {
      attributes: createAttributes(searchObj),
      where: createWhereFromSearch(searchObj),
      transaction: this.context.transaction,
      limit: searchObj?.params?.limit ? searchObj.params.limit : null,
      offset: searchObj?.params?.offset ? searchObj.params.offset : null,
      order: searchObj?.params?.sortOrder ? createOrder(searchObj.params.sortOrder) : [],
      include: [
        ...createComplexInclude(searchObj, this.model, this.models),
        ...createInclude(searchObj, this.model, this.models)
      ],
      group: searchObj?.aggregationParams?.length > 0
        && searchObj?.params?.columns
        ? searchObj.params.columns.replace(' ', '').split(',') : null
    };
    const data = await this.model.findAndCountAll(query);
    const resp = handleResponse(data);
    return resp;
  }

  async update(id, updateRequest) {
    const req = updateRequest;
    const data = await this.model.update(
      req,
      {
        where: id,
        transaction: this.context.transaction,
        returning: true,
        plain: false
      }
    );
    return data;
  }

  async insert(insertReqest) {
    const req = insertReqest;
    const data = await this.model.create(
      req,
      { transaction: this.context.transaction }
    );
    const resp = handleResponse(data);
    return resp;
  }

  async delete(search) {
    const data = await this.model.destroy({
      where: createWhereFromSearch(search),
      transaction: this.context.transaction
    });
    return data;
  }

  async bulkInsert(insertReqest) {
    const req = insertReqest;
    req.creatorId = this.context.principalId;
    const data = await this.model.bulkCreate(
      req,
      { transaction: this.context.transaction, returning: true }
    );
    const resp = handleResponse(data);
    return resp;
  }

  async count(search = {}) {
    return this.model.count({
      where: createWhereFromSearch(search),
      transaction: this.context.transaction,
      include: [
        ...createComplexInclude(search, this.model, this.models),
        ...createInclude(search, this.model, this.models)
      ]
    });
  }

  async callSqlProcedure(procedure, ...params) {
    let queryParams = '';
    const bindedParams = {};

    if (params && params.length > 0) {
      params.forEach((el, index) => {
        queryParams = (index === 0) ? `$p${index}` : `${queryParams}, $p${index}`;
        bindedParams[`p${index}`] = el;
      });
    }

    const results = await this.sequelize.query(`SELECT * FROM ${procedure}(${queryParams});`, {
      bind: bindedParams,
      type: QueryTypes.SELECT
    })
    return results;
  }

  async getPgTimezone(tzAbbreviation, tzOffset) {
    if (!tzAbbreviation || !tzOffset) {
      throw new Error('Timezone abbreviation and timezone offset must be provided');
    }

    const results = await this.sequelize.query(`
      SELECT name as timezone
      FROM pg_timezone_names
      WHERE LOWER(abbrev) = LOWER($p0) AND utc_offset = $p1
      ORDER BY name
      LIMIT 1;`, {
        bind: { p0: tzAbbreviation, p1: tzOffset },
        type: QueryTypes.SELECT
      }
    );
    if (!results || results.length === 0) {
      return null;
    }

    return results[0];
  }

}

export default SequelizeRepository;

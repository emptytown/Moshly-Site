var __create = Object.create;
var __defProp = Object.defineProperty;
var __getOwnPropDesc = Object.getOwnPropertyDescriptor;
var __getOwnPropNames = Object.getOwnPropertyNames;
var __getProtoOf = Object.getPrototypeOf;
var __hasOwnProp = Object.prototype.hasOwnProperty;
var __name = (target, value) => __defProp(target, "name", { value, configurable: true });
var __esm = (fn, res) => function __init() {
  return fn && (res = (0, fn[__getOwnPropNames(fn)[0]])(fn = 0)), res;
};
var __commonJS = (cb, mod) => function __require() {
  return mod || (0, cb[__getOwnPropNames(cb)[0]])((mod = { exports: {} }).exports, mod), mod.exports;
};
var __copyProps = (to, from, except2, desc2) => {
  if (from && typeof from === "object" || typeof from === "function") {
    for (let key of __getOwnPropNames(from))
      if (!__hasOwnProp.call(to, key) && key !== except2)
        __defProp(to, key, { get: () => from[key], enumerable: !(desc2 = __getOwnPropDesc(from, key)) || desc2.enumerable });
  }
  return to;
};
var __toESM = (mod, isNodeMode, target) => (target = mod != null ? __create(__getProtoOf(mod)) : {}, __copyProps(
  // If the importer is in node compatibility mode or this is not an ESM
  // file that has been converted to a CommonJS file using a Babel-
  // compatible transform (i.e. "__esModule" has not been set), then set
  // "default" to the CommonJS "module.exports" for node compatibility.
  isNodeMode || !mod || !mod.__esModule ? __defProp(target, "default", { value: mod, enumerable: true }) : target,
  mod
));

// ../node_modules/drizzle-orm/entity.js
function is(value, type) {
  if (!value || typeof value !== "object") {
    return false;
  }
  if (value instanceof type) {
    return true;
  }
  if (!Object.prototype.hasOwnProperty.call(type, entityKind)) {
    throw new Error(
      `Class "${type.name ?? "<unknown>"}" doesn't look like a Drizzle entity. If this is incorrect and the class is provided by Drizzle, please report this as a bug.`
    );
  }
  let cls = Object.getPrototypeOf(value).constructor;
  if (cls) {
    while (cls) {
      if (entityKind in cls && cls[entityKind] === type[entityKind]) {
        return true;
      }
      cls = Object.getPrototypeOf(cls);
    }
  }
  return false;
}
var entityKind;
var init_entity = __esm({
  "../node_modules/drizzle-orm/entity.js"() {
    init_functionsRoutes_0_4727514041666032();
    entityKind = /* @__PURE__ */ Symbol.for("drizzle:entityKind");
    __name(is, "is");
  }
});

// ../node_modules/drizzle-orm/logger.js
var ConsoleLogWriter, DefaultLogger, NoopLogger;
var init_logger = __esm({
  "../node_modules/drizzle-orm/logger.js"() {
    init_functionsRoutes_0_4727514041666032();
    init_entity();
    ConsoleLogWriter = class {
      static {
        __name(this, "ConsoleLogWriter");
      }
      static [entityKind] = "ConsoleLogWriter";
      write(message2) {
        console.log(message2);
      }
    };
    DefaultLogger = class {
      static {
        __name(this, "DefaultLogger");
      }
      static [entityKind] = "DefaultLogger";
      writer;
      constructor(config) {
        this.writer = config?.writer ?? new ConsoleLogWriter();
      }
      logQuery(query, params) {
        const stringifiedParams = params.map((p) => {
          try {
            return JSON.stringify(p);
          } catch {
            return String(p);
          }
        });
        const paramsStr = stringifiedParams.length ? ` -- params: [${stringifiedParams.join(", ")}]` : "";
        this.writer.write(`Query: ${query}${paramsStr}`);
      }
    };
    NoopLogger = class {
      static {
        __name(this, "NoopLogger");
      }
      static [entityKind] = "NoopLogger";
      logQuery() {
      }
    };
  }
});

// ../node_modules/drizzle-orm/table.utils.js
var TableName;
var init_table_utils = __esm({
  "../node_modules/drizzle-orm/table.utils.js"() {
    init_functionsRoutes_0_4727514041666032();
    TableName = /* @__PURE__ */ Symbol.for("drizzle:Name");
  }
});

// ../node_modules/drizzle-orm/table.js
function getTableName(table) {
  return table[TableName];
}
function getTableUniqueName(table) {
  return `${table[Schema] ?? "public"}.${table[TableName]}`;
}
var Schema, Columns, ExtraConfigColumns, OriginalName, BaseName, IsAlias, ExtraConfigBuilder, IsDrizzleTable, Table;
var init_table = __esm({
  "../node_modules/drizzle-orm/table.js"() {
    init_functionsRoutes_0_4727514041666032();
    init_entity();
    init_table_utils();
    Schema = /* @__PURE__ */ Symbol.for("drizzle:Schema");
    Columns = /* @__PURE__ */ Symbol.for("drizzle:Columns");
    ExtraConfigColumns = /* @__PURE__ */ Symbol.for("drizzle:ExtraConfigColumns");
    OriginalName = /* @__PURE__ */ Symbol.for("drizzle:OriginalName");
    BaseName = /* @__PURE__ */ Symbol.for("drizzle:BaseName");
    IsAlias = /* @__PURE__ */ Symbol.for("drizzle:IsAlias");
    ExtraConfigBuilder = /* @__PURE__ */ Symbol.for("drizzle:ExtraConfigBuilder");
    IsDrizzleTable = /* @__PURE__ */ Symbol.for("drizzle:IsDrizzleTable");
    Table = class {
      static {
        __name(this, "Table");
      }
      static [entityKind] = "Table";
      /** @internal */
      static Symbol = {
        Name: TableName,
        Schema,
        OriginalName,
        Columns,
        ExtraConfigColumns,
        BaseName,
        IsAlias,
        ExtraConfigBuilder
      };
      /**
       * @internal
       * Can be changed if the table is aliased.
       */
      [TableName];
      /**
       * @internal
       * Used to store the original name of the table, before any aliasing.
       */
      [OriginalName];
      /** @internal */
      [Schema];
      /** @internal */
      [Columns];
      /** @internal */
      [ExtraConfigColumns];
      /**
       *  @internal
       * Used to store the table name before the transformation via the `tableCreator` functions.
       */
      [BaseName];
      /** @internal */
      [IsAlias] = false;
      /** @internal */
      [IsDrizzleTable] = true;
      /** @internal */
      [ExtraConfigBuilder] = void 0;
      constructor(name, schema, baseName) {
        this[TableName] = this[OriginalName] = name;
        this[Schema] = schema;
        this[BaseName] = baseName;
      }
    };
    __name(getTableName, "getTableName");
    __name(getTableUniqueName, "getTableUniqueName");
  }
});

// ../node_modules/drizzle-orm/column.js
var Column;
var init_column = __esm({
  "../node_modules/drizzle-orm/column.js"() {
    init_functionsRoutes_0_4727514041666032();
    init_entity();
    Column = class {
      static {
        __name(this, "Column");
      }
      constructor(table, config) {
        this.table = table;
        this.config = config;
        this.name = config.name;
        this.keyAsName = config.keyAsName;
        this.notNull = config.notNull;
        this.default = config.default;
        this.defaultFn = config.defaultFn;
        this.onUpdateFn = config.onUpdateFn;
        this.hasDefault = config.hasDefault;
        this.primary = config.primaryKey;
        this.isUnique = config.isUnique;
        this.uniqueName = config.uniqueName;
        this.uniqueType = config.uniqueType;
        this.dataType = config.dataType;
        this.columnType = config.columnType;
        this.generated = config.generated;
        this.generatedIdentity = config.generatedIdentity;
      }
      static [entityKind] = "Column";
      name;
      keyAsName;
      primary;
      notNull;
      default;
      defaultFn;
      onUpdateFn;
      hasDefault;
      isUnique;
      uniqueName;
      uniqueType;
      dataType;
      columnType;
      enumValues = void 0;
      generated = void 0;
      generatedIdentity = void 0;
      config;
      mapFromDriverValue(value) {
        return value;
      }
      mapToDriverValue(value) {
        return value;
      }
      // ** @internal */
      shouldDisableInsert() {
        return this.config.generated !== void 0 && this.config.generated.type !== "byDefault";
      }
    };
  }
});

// ../node_modules/drizzle-orm/column-builder.js
var ColumnBuilder;
var init_column_builder = __esm({
  "../node_modules/drizzle-orm/column-builder.js"() {
    init_functionsRoutes_0_4727514041666032();
    init_entity();
    ColumnBuilder = class {
      static {
        __name(this, "ColumnBuilder");
      }
      static [entityKind] = "ColumnBuilder";
      config;
      constructor(name, dataType, columnType) {
        this.config = {
          name,
          keyAsName: name === "",
          notNull: false,
          default: void 0,
          hasDefault: false,
          primaryKey: false,
          isUnique: false,
          uniqueName: void 0,
          uniqueType: void 0,
          dataType,
          columnType,
          generated: void 0
        };
      }
      /**
       * Changes the data type of the column. Commonly used with `json` columns. Also, useful for branded types.
       *
       * @example
       * ```ts
       * const users = pgTable('users', {
       * 	id: integer('id').$type<UserId>().primaryKey(),
       * 	details: json('details').$type<UserDetails>().notNull(),
       * });
       * ```
       */
      $type() {
        return this;
      }
      /**
       * Adds a `not null` clause to the column definition.
       *
       * Affects the `select` model of the table - columns *without* `not null` will be nullable on select.
       */
      notNull() {
        this.config.notNull = true;
        return this;
      }
      /**
       * Adds a `default <value>` clause to the column definition.
       *
       * Affects the `insert` model of the table - columns *with* `default` are optional on insert.
       *
       * If you need to set a dynamic default value, use {@link $defaultFn} instead.
       */
      default(value) {
        this.config.default = value;
        this.config.hasDefault = true;
        return this;
      }
      /**
       * Adds a dynamic default value to the column.
       * The function will be called when the row is inserted, and the returned value will be used as the column value.
       *
       * **Note:** This value does not affect the `drizzle-kit` behavior, it is only used at runtime in `drizzle-orm`.
       */
      $defaultFn(fn) {
        this.config.defaultFn = fn;
        this.config.hasDefault = true;
        return this;
      }
      /**
       * Alias for {@link $defaultFn}.
       */
      $default = this.$defaultFn;
      /**
       * Adds a dynamic update value to the column.
       * The function will be called when the row is updated, and the returned value will be used as the column value if none is provided.
       * If no `default` (or `$defaultFn`) value is provided, the function will be called when the row is inserted as well, and the returned value will be used as the column value.
       *
       * **Note:** This value does not affect the `drizzle-kit` behavior, it is only used at runtime in `drizzle-orm`.
       */
      $onUpdateFn(fn) {
        this.config.onUpdateFn = fn;
        this.config.hasDefault = true;
        return this;
      }
      /**
       * Alias for {@link $onUpdateFn}.
       */
      $onUpdate = this.$onUpdateFn;
      /**
       * Adds a `primary key` clause to the column definition. This implicitly makes the column `not null`.
       *
       * In SQLite, `integer primary key` implicitly makes the column auto-incrementing.
       */
      primaryKey() {
        this.config.primaryKey = true;
        this.config.notNull = true;
        return this;
      }
      /** @internal Sets the name of the column to the key within the table definition if a name was not given. */
      setName(name) {
        if (this.config.name !== "") return;
        this.config.name = name;
      }
    };
  }
});

// ../node_modules/drizzle-orm/pg-core/foreign-keys.js
var ForeignKeyBuilder, ForeignKey;
var init_foreign_keys = __esm({
  "../node_modules/drizzle-orm/pg-core/foreign-keys.js"() {
    init_functionsRoutes_0_4727514041666032();
    init_entity();
    init_table_utils();
    ForeignKeyBuilder = class {
      static {
        __name(this, "ForeignKeyBuilder");
      }
      static [entityKind] = "PgForeignKeyBuilder";
      /** @internal */
      reference;
      /** @internal */
      _onUpdate = "no action";
      /** @internal */
      _onDelete = "no action";
      constructor(config, actions) {
        this.reference = () => {
          const { name, columns, foreignColumns } = config();
          return { name, columns, foreignTable: foreignColumns[0].table, foreignColumns };
        };
        if (actions) {
          this._onUpdate = actions.onUpdate;
          this._onDelete = actions.onDelete;
        }
      }
      onUpdate(action) {
        this._onUpdate = action === void 0 ? "no action" : action;
        return this;
      }
      onDelete(action) {
        this._onDelete = action === void 0 ? "no action" : action;
        return this;
      }
      /** @internal */
      build(table) {
        return new ForeignKey(table, this);
      }
    };
    ForeignKey = class {
      static {
        __name(this, "ForeignKey");
      }
      constructor(table, builder) {
        this.table = table;
        this.reference = builder.reference;
        this.onUpdate = builder._onUpdate;
        this.onDelete = builder._onDelete;
      }
      static [entityKind] = "PgForeignKey";
      reference;
      onUpdate;
      onDelete;
      getName() {
        const { name, columns, foreignColumns } = this.reference();
        const columnNames = columns.map((column) => column.name);
        const foreignColumnNames = foreignColumns.map((column) => column.name);
        const chunks = [
          this.table[TableName],
          ...columnNames,
          foreignColumns[0].table[TableName],
          ...foreignColumnNames
        ];
        return name ?? `${chunks.join("_")}_fk`;
      }
    };
  }
});

// ../node_modules/drizzle-orm/tracing-utils.js
function iife(fn, ...args) {
  return fn(...args);
}
var init_tracing_utils = __esm({
  "../node_modules/drizzle-orm/tracing-utils.js"() {
    init_functionsRoutes_0_4727514041666032();
    __name(iife, "iife");
  }
});

// ../node_modules/drizzle-orm/pg-core/unique-constraint.js
function uniqueKeyName(table, columns) {
  return `${table[TableName]}_${columns.join("_")}_unique`;
}
var UniqueConstraintBuilder, UniqueOnConstraintBuilder, UniqueConstraint;
var init_unique_constraint = __esm({
  "../node_modules/drizzle-orm/pg-core/unique-constraint.js"() {
    init_functionsRoutes_0_4727514041666032();
    init_entity();
    init_table_utils();
    __name(uniqueKeyName, "uniqueKeyName");
    UniqueConstraintBuilder = class {
      static {
        __name(this, "UniqueConstraintBuilder");
      }
      constructor(columns, name) {
        this.name = name;
        this.columns = columns;
      }
      static [entityKind] = "PgUniqueConstraintBuilder";
      /** @internal */
      columns;
      /** @internal */
      nullsNotDistinctConfig = false;
      nullsNotDistinct() {
        this.nullsNotDistinctConfig = true;
        return this;
      }
      /** @internal */
      build(table) {
        return new UniqueConstraint(table, this.columns, this.nullsNotDistinctConfig, this.name);
      }
    };
    UniqueOnConstraintBuilder = class {
      static {
        __name(this, "UniqueOnConstraintBuilder");
      }
      static [entityKind] = "PgUniqueOnConstraintBuilder";
      /** @internal */
      name;
      constructor(name) {
        this.name = name;
      }
      on(...columns) {
        return new UniqueConstraintBuilder(columns, this.name);
      }
    };
    UniqueConstraint = class {
      static {
        __name(this, "UniqueConstraint");
      }
      constructor(table, columns, nullsNotDistinct, name) {
        this.table = table;
        this.columns = columns;
        this.name = name ?? uniqueKeyName(this.table, this.columns.map((column) => column.name));
        this.nullsNotDistinct = nullsNotDistinct;
      }
      static [entityKind] = "PgUniqueConstraint";
      columns;
      name;
      nullsNotDistinct = false;
      getName() {
        return this.name;
      }
    };
  }
});

// ../node_modules/drizzle-orm/pg-core/utils/array.js
function parsePgArrayValue(arrayString, startFrom, inQuotes) {
  for (let i = startFrom; i < arrayString.length; i++) {
    const char = arrayString[i];
    if (char === "\\") {
      i++;
      continue;
    }
    if (char === '"') {
      return [arrayString.slice(startFrom, i).replace(/\\/g, ""), i + 1];
    }
    if (inQuotes) {
      continue;
    }
    if (char === "," || char === "}") {
      return [arrayString.slice(startFrom, i).replace(/\\/g, ""), i];
    }
  }
  return [arrayString.slice(startFrom).replace(/\\/g, ""), arrayString.length];
}
function parsePgNestedArray(arrayString, startFrom = 0) {
  const result = [];
  let i = startFrom;
  let lastCharIsComma = false;
  while (i < arrayString.length) {
    const char = arrayString[i];
    if (char === ",") {
      if (lastCharIsComma || i === startFrom) {
        result.push("");
      }
      lastCharIsComma = true;
      i++;
      continue;
    }
    lastCharIsComma = false;
    if (char === "\\") {
      i += 2;
      continue;
    }
    if (char === '"') {
      const [value2, startFrom2] = parsePgArrayValue(arrayString, i + 1, true);
      result.push(value2);
      i = startFrom2;
      continue;
    }
    if (char === "}") {
      return [result, i + 1];
    }
    if (char === "{") {
      const [value2, startFrom2] = parsePgNestedArray(arrayString, i + 1);
      result.push(value2);
      i = startFrom2;
      continue;
    }
    const [value, newStartFrom] = parsePgArrayValue(arrayString, i, false);
    result.push(value);
    i = newStartFrom;
  }
  return [result, i];
}
function parsePgArray(arrayString) {
  const [result] = parsePgNestedArray(arrayString, 1);
  return result;
}
function makePgArray(array) {
  return `{${array.map((item) => {
    if (Array.isArray(item)) {
      return makePgArray(item);
    }
    if (typeof item === "string") {
      return `"${item.replace(/\\/g, "\\\\").replace(/"/g, '\\"')}"`;
    }
    return `${item}`;
  }).join(",")}}`;
}
var init_array = __esm({
  "../node_modules/drizzle-orm/pg-core/utils/array.js"() {
    init_functionsRoutes_0_4727514041666032();
    __name(parsePgArrayValue, "parsePgArrayValue");
    __name(parsePgNestedArray, "parsePgNestedArray");
    __name(parsePgArray, "parsePgArray");
    __name(makePgArray, "makePgArray");
  }
});

// ../node_modules/drizzle-orm/pg-core/columns/common.js
var PgColumnBuilder, PgColumn, ExtraConfigColumn, IndexedColumn, PgArrayBuilder, PgArray;
var init_common = __esm({
  "../node_modules/drizzle-orm/pg-core/columns/common.js"() {
    init_functionsRoutes_0_4727514041666032();
    init_column_builder();
    init_column();
    init_entity();
    init_foreign_keys();
    init_tracing_utils();
    init_unique_constraint();
    init_array();
    PgColumnBuilder = class extends ColumnBuilder {
      static {
        __name(this, "PgColumnBuilder");
      }
      foreignKeyConfigs = [];
      static [entityKind] = "PgColumnBuilder";
      array(size) {
        return new PgArrayBuilder(this.config.name, this, size);
      }
      references(ref, actions = {}) {
        this.foreignKeyConfigs.push({ ref, actions });
        return this;
      }
      unique(name, config) {
        this.config.isUnique = true;
        this.config.uniqueName = name;
        this.config.uniqueType = config?.nulls;
        return this;
      }
      generatedAlwaysAs(as) {
        this.config.generated = {
          as,
          type: "always",
          mode: "stored"
        };
        return this;
      }
      /** @internal */
      buildForeignKeys(column, table) {
        return this.foreignKeyConfigs.map(({ ref, actions }) => {
          return iife(
            (ref2, actions2) => {
              const builder = new ForeignKeyBuilder(() => {
                const foreignColumn = ref2();
                return { columns: [column], foreignColumns: [foreignColumn] };
              });
              if (actions2.onUpdate) {
                builder.onUpdate(actions2.onUpdate);
              }
              if (actions2.onDelete) {
                builder.onDelete(actions2.onDelete);
              }
              return builder.build(table);
            },
            ref,
            actions
          );
        });
      }
      /** @internal */
      buildExtraConfigColumn(table) {
        return new ExtraConfigColumn(table, this.config);
      }
    };
    PgColumn = class extends Column {
      static {
        __name(this, "PgColumn");
      }
      constructor(table, config) {
        if (!config.uniqueName) {
          config.uniqueName = uniqueKeyName(table, [config.name]);
        }
        super(table, config);
        this.table = table;
      }
      static [entityKind] = "PgColumn";
    };
    ExtraConfigColumn = class extends PgColumn {
      static {
        __name(this, "ExtraConfigColumn");
      }
      static [entityKind] = "ExtraConfigColumn";
      getSQLType() {
        return this.getSQLType();
      }
      indexConfig = {
        order: this.config.order ?? "asc",
        nulls: this.config.nulls ?? "last",
        opClass: this.config.opClass
      };
      defaultConfig = {
        order: "asc",
        nulls: "last",
        opClass: void 0
      };
      asc() {
        this.indexConfig.order = "asc";
        return this;
      }
      desc() {
        this.indexConfig.order = "desc";
        return this;
      }
      nullsFirst() {
        this.indexConfig.nulls = "first";
        return this;
      }
      nullsLast() {
        this.indexConfig.nulls = "last";
        return this;
      }
      /**
       * ### PostgreSQL documentation quote
       *
       * > An operator class with optional parameters can be specified for each column of an index.
       * The operator class identifies the operators to be used by the index for that column.
       * For example, a B-tree index on four-byte integers would use the int4_ops class;
       * this operator class includes comparison functions for four-byte integers.
       * In practice the default operator class for the column's data type is usually sufficient.
       * The main point of having operator classes is that for some data types, there could be more than one meaningful ordering.
       * For example, we might want to sort a complex-number data type either by absolute value or by real part.
       * We could do this by defining two operator classes for the data type and then selecting the proper class when creating an index.
       * More information about operator classes check:
       *
       * ### Useful links
       * https://www.postgresql.org/docs/current/sql-createindex.html
       *
       * https://www.postgresql.org/docs/current/indexes-opclass.html
       *
       * https://www.postgresql.org/docs/current/xindex.html
       *
       * ### Additional types
       * If you have the `pg_vector` extension installed in your database, you can use the
       * `vector_l2_ops`, `vector_ip_ops`, `vector_cosine_ops`, `vector_l1_ops`, `bit_hamming_ops`, `bit_jaccard_ops`, `halfvec_l2_ops`, `sparsevec_l2_ops` options, which are predefined types.
       *
       * **You can always specify any string you want in the operator class, in case Drizzle doesn't have it natively in its types**
       *
       * @param opClass
       * @returns
       */
      op(opClass) {
        this.indexConfig.opClass = opClass;
        return this;
      }
    };
    IndexedColumn = class {
      static {
        __name(this, "IndexedColumn");
      }
      static [entityKind] = "IndexedColumn";
      constructor(name, keyAsName, type, indexConfig) {
        this.name = name;
        this.keyAsName = keyAsName;
        this.type = type;
        this.indexConfig = indexConfig;
      }
      name;
      keyAsName;
      type;
      indexConfig;
    };
    PgArrayBuilder = class extends PgColumnBuilder {
      static {
        __name(this, "PgArrayBuilder");
      }
      static [entityKind] = "PgArrayBuilder";
      constructor(name, baseBuilder, size) {
        super(name, "array", "PgArray");
        this.config.baseBuilder = baseBuilder;
        this.config.size = size;
      }
      /** @internal */
      build(table) {
        const baseColumn = this.config.baseBuilder.build(table);
        return new PgArray(
          table,
          this.config,
          baseColumn
        );
      }
    };
    PgArray = class _PgArray extends PgColumn {
      static {
        __name(this, "PgArray");
      }
      constructor(table, config, baseColumn, range) {
        super(table, config);
        this.baseColumn = baseColumn;
        this.range = range;
        this.size = config.size;
      }
      size;
      static [entityKind] = "PgArray";
      getSQLType() {
        return `${this.baseColumn.getSQLType()}[${typeof this.size === "number" ? this.size : ""}]`;
      }
      mapFromDriverValue(value) {
        if (typeof value === "string") {
          value = parsePgArray(value);
        }
        return value.map((v) => this.baseColumn.mapFromDriverValue(v));
      }
      mapToDriverValue(value, isNestedArray = false) {
        const a = value.map(
          (v) => v === null ? null : is(this.baseColumn, _PgArray) ? this.baseColumn.mapToDriverValue(v, true) : this.baseColumn.mapToDriverValue(v)
        );
        if (isNestedArray) return a;
        return makePgArray(a);
      }
    };
  }
});

// ../node_modules/drizzle-orm/pg-core/columns/enum.js
function isPgEnum(obj) {
  return !!obj && typeof obj === "function" && isPgEnumSym in obj && obj[isPgEnumSym] === true;
}
var PgEnumObjectColumnBuilder, PgEnumObjectColumn, isPgEnumSym, PgEnumColumnBuilder, PgEnumColumn;
var init_enum = __esm({
  "../node_modules/drizzle-orm/pg-core/columns/enum.js"() {
    init_functionsRoutes_0_4727514041666032();
    init_entity();
    init_common();
    PgEnumObjectColumnBuilder = class extends PgColumnBuilder {
      static {
        __name(this, "PgEnumObjectColumnBuilder");
      }
      static [entityKind] = "PgEnumObjectColumnBuilder";
      constructor(name, enumInstance) {
        super(name, "string", "PgEnumObjectColumn");
        this.config.enum = enumInstance;
      }
      /** @internal */
      build(table) {
        return new PgEnumObjectColumn(
          table,
          this.config
        );
      }
    };
    PgEnumObjectColumn = class extends PgColumn {
      static {
        __name(this, "PgEnumObjectColumn");
      }
      static [entityKind] = "PgEnumObjectColumn";
      enum;
      enumValues = this.config.enum.enumValues;
      constructor(table, config) {
        super(table, config);
        this.enum = config.enum;
      }
      getSQLType() {
        return this.enum.enumName;
      }
    };
    isPgEnumSym = /* @__PURE__ */ Symbol.for("drizzle:isPgEnum");
    __name(isPgEnum, "isPgEnum");
    PgEnumColumnBuilder = class extends PgColumnBuilder {
      static {
        __name(this, "PgEnumColumnBuilder");
      }
      static [entityKind] = "PgEnumColumnBuilder";
      constructor(name, enumInstance) {
        super(name, "string", "PgEnumColumn");
        this.config.enum = enumInstance;
      }
      /** @internal */
      build(table) {
        return new PgEnumColumn(
          table,
          this.config
        );
      }
    };
    PgEnumColumn = class extends PgColumn {
      static {
        __name(this, "PgEnumColumn");
      }
      static [entityKind] = "PgEnumColumn";
      enum = this.config.enum;
      enumValues = this.config.enum.enumValues;
      constructor(table, config) {
        super(table, config);
        this.enum = config.enum;
      }
      getSQLType() {
        return this.enum.enumName;
      }
    };
  }
});

// ../node_modules/drizzle-orm/subquery.js
var Subquery, WithSubquery;
var init_subquery = __esm({
  "../node_modules/drizzle-orm/subquery.js"() {
    init_functionsRoutes_0_4727514041666032();
    init_entity();
    Subquery = class {
      static {
        __name(this, "Subquery");
      }
      static [entityKind] = "Subquery";
      constructor(sql2, fields, alias, isWith = false, usedTables = []) {
        this._ = {
          brand: "Subquery",
          sql: sql2,
          selectedFields: fields,
          alias,
          isWith,
          usedTables
        };
      }
      // getSQL(): SQL<unknown> {
      // 	return new SQL([this]);
      // }
    };
    WithSubquery = class extends Subquery {
      static {
        __name(this, "WithSubquery");
      }
      static [entityKind] = "WithSubquery";
    };
  }
});

// ../node_modules/drizzle-orm/version.js
var version;
var init_version = __esm({
  "../node_modules/drizzle-orm/version.js"() {
    init_functionsRoutes_0_4727514041666032();
    version = "0.45.1";
  }
});

// ../node_modules/drizzle-orm/tracing.js
var otel, rawTracer, tracer;
var init_tracing = __esm({
  "../node_modules/drizzle-orm/tracing.js"() {
    init_functionsRoutes_0_4727514041666032();
    init_tracing_utils();
    init_version();
    tracer = {
      startActiveSpan(name, fn) {
        if (!otel) {
          return fn();
        }
        if (!rawTracer) {
          rawTracer = otel.trace.getTracer("drizzle-orm", version);
        }
        return iife(
          (otel2, rawTracer2) => rawTracer2.startActiveSpan(
            name,
            (span) => {
              try {
                return fn(span);
              } catch (e) {
                span.setStatus({
                  code: otel2.SpanStatusCode.ERROR,
                  message: e instanceof Error ? e.message : "Unknown error"
                  // eslint-disable-line no-instanceof/no-instanceof
                });
                throw e;
              } finally {
                span.end();
              }
            }
          ),
          otel,
          rawTracer
        );
      }
    };
  }
});

// ../node_modules/drizzle-orm/view-common.js
var ViewBaseConfig;
var init_view_common = __esm({
  "../node_modules/drizzle-orm/view-common.js"() {
    init_functionsRoutes_0_4727514041666032();
    ViewBaseConfig = /* @__PURE__ */ Symbol.for("drizzle:ViewBaseConfig");
  }
});

// ../node_modules/drizzle-orm/sql/sql.js
function isSQLWrapper(value) {
  return value !== null && value !== void 0 && typeof value.getSQL === "function";
}
function mergeQueries(queries) {
  const result = { sql: "", params: [] };
  for (const query of queries) {
    result.sql += query.sql;
    result.params.push(...query.params);
    if (query.typings?.length) {
      if (!result.typings) {
        result.typings = [];
      }
      result.typings.push(...query.typings);
    }
  }
  return result;
}
function isDriverValueEncoder(value) {
  return typeof value === "object" && value !== null && "mapToDriverValue" in value && typeof value.mapToDriverValue === "function";
}
function sql(strings, ...params) {
  const queryChunks = [];
  if (params.length > 0 || strings.length > 0 && strings[0] !== "") {
    queryChunks.push(new StringChunk(strings[0]));
  }
  for (const [paramIndex, param2] of params.entries()) {
    queryChunks.push(param2, new StringChunk(strings[paramIndex + 1]));
  }
  return new SQL(queryChunks);
}
function fillPlaceholders(params, values) {
  return params.map((p) => {
    if (is(p, Placeholder)) {
      if (!(p.name in values)) {
        throw new Error(`No value for placeholder "${p.name}" was provided`);
      }
      return values[p.name];
    }
    if (is(p, Param) && is(p.value, Placeholder)) {
      if (!(p.value.name in values)) {
        throw new Error(`No value for placeholder "${p.value.name}" was provided`);
      }
      return p.encoder.mapToDriverValue(values[p.value.name]);
    }
    return p;
  });
}
var FakePrimitiveParam, StringChunk, SQL, Name, noopDecoder, noopEncoder, noopMapper, Param, Placeholder, IsDrizzleView, View;
var init_sql = __esm({
  "../node_modules/drizzle-orm/sql/sql.js"() {
    init_functionsRoutes_0_4727514041666032();
    init_entity();
    init_enum();
    init_subquery();
    init_tracing();
    init_view_common();
    init_column();
    init_table();
    FakePrimitiveParam = class {
      static {
        __name(this, "FakePrimitiveParam");
      }
      static [entityKind] = "FakePrimitiveParam";
    };
    __name(isSQLWrapper, "isSQLWrapper");
    __name(mergeQueries, "mergeQueries");
    StringChunk = class {
      static {
        __name(this, "StringChunk");
      }
      static [entityKind] = "StringChunk";
      value;
      constructor(value) {
        this.value = Array.isArray(value) ? value : [value];
      }
      getSQL() {
        return new SQL([this]);
      }
    };
    SQL = class _SQL {
      static {
        __name(this, "SQL");
      }
      constructor(queryChunks) {
        this.queryChunks = queryChunks;
        for (const chunk of queryChunks) {
          if (is(chunk, Table)) {
            const schemaName = chunk[Table.Symbol.Schema];
            this.usedTables.push(
              schemaName === void 0 ? chunk[Table.Symbol.Name] : schemaName + "." + chunk[Table.Symbol.Name]
            );
          }
        }
      }
      static [entityKind] = "SQL";
      /** @internal */
      decoder = noopDecoder;
      shouldInlineParams = false;
      /** @internal */
      usedTables = [];
      append(query) {
        this.queryChunks.push(...query.queryChunks);
        return this;
      }
      toQuery(config) {
        return tracer.startActiveSpan("drizzle.buildSQL", (span) => {
          const query = this.buildQueryFromSourceParams(this.queryChunks, config);
          span?.setAttributes({
            "drizzle.query.text": query.sql,
            "drizzle.query.params": JSON.stringify(query.params)
          });
          return query;
        });
      }
      buildQueryFromSourceParams(chunks, _config) {
        const config = Object.assign({}, _config, {
          inlineParams: _config.inlineParams || this.shouldInlineParams,
          paramStartIndex: _config.paramStartIndex || { value: 0 }
        });
        const {
          casing,
          escapeName,
          escapeParam,
          prepareTyping,
          inlineParams,
          paramStartIndex
        } = config;
        return mergeQueries(chunks.map((chunk) => {
          if (is(chunk, StringChunk)) {
            return { sql: chunk.value.join(""), params: [] };
          }
          if (is(chunk, Name)) {
            return { sql: escapeName(chunk.value), params: [] };
          }
          if (chunk === void 0) {
            return { sql: "", params: [] };
          }
          if (Array.isArray(chunk)) {
            const result = [new StringChunk("(")];
            for (const [i, p] of chunk.entries()) {
              result.push(p);
              if (i < chunk.length - 1) {
                result.push(new StringChunk(", "));
              }
            }
            result.push(new StringChunk(")"));
            return this.buildQueryFromSourceParams(result, config);
          }
          if (is(chunk, _SQL)) {
            return this.buildQueryFromSourceParams(chunk.queryChunks, {
              ...config,
              inlineParams: inlineParams || chunk.shouldInlineParams
            });
          }
          if (is(chunk, Table)) {
            const schemaName = chunk[Table.Symbol.Schema];
            const tableName = chunk[Table.Symbol.Name];
            return {
              sql: schemaName === void 0 || chunk[IsAlias] ? escapeName(tableName) : escapeName(schemaName) + "." + escapeName(tableName),
              params: []
            };
          }
          if (is(chunk, Column)) {
            const columnName = casing.getColumnCasing(chunk);
            if (_config.invokeSource === "indexes") {
              return { sql: escapeName(columnName), params: [] };
            }
            const schemaName = chunk.table[Table.Symbol.Schema];
            return {
              sql: chunk.table[IsAlias] || schemaName === void 0 ? escapeName(chunk.table[Table.Symbol.Name]) + "." + escapeName(columnName) : escapeName(schemaName) + "." + escapeName(chunk.table[Table.Symbol.Name]) + "." + escapeName(columnName),
              params: []
            };
          }
          if (is(chunk, View)) {
            const schemaName = chunk[ViewBaseConfig].schema;
            const viewName = chunk[ViewBaseConfig].name;
            return {
              sql: schemaName === void 0 || chunk[ViewBaseConfig].isAlias ? escapeName(viewName) : escapeName(schemaName) + "." + escapeName(viewName),
              params: []
            };
          }
          if (is(chunk, Param)) {
            if (is(chunk.value, Placeholder)) {
              return { sql: escapeParam(paramStartIndex.value++, chunk), params: [chunk], typings: ["none"] };
            }
            const mappedValue = chunk.value === null ? null : chunk.encoder.mapToDriverValue(chunk.value);
            if (is(mappedValue, _SQL)) {
              return this.buildQueryFromSourceParams([mappedValue], config);
            }
            if (inlineParams) {
              return { sql: this.mapInlineParam(mappedValue, config), params: [] };
            }
            let typings = ["none"];
            if (prepareTyping) {
              typings = [prepareTyping(chunk.encoder)];
            }
            return { sql: escapeParam(paramStartIndex.value++, mappedValue), params: [mappedValue], typings };
          }
          if (is(chunk, Placeholder)) {
            return { sql: escapeParam(paramStartIndex.value++, chunk), params: [chunk], typings: ["none"] };
          }
          if (is(chunk, _SQL.Aliased) && chunk.fieldAlias !== void 0) {
            return { sql: escapeName(chunk.fieldAlias), params: [] };
          }
          if (is(chunk, Subquery)) {
            if (chunk._.isWith) {
              return { sql: escapeName(chunk._.alias), params: [] };
            }
            return this.buildQueryFromSourceParams([
              new StringChunk("("),
              chunk._.sql,
              new StringChunk(") "),
              new Name(chunk._.alias)
            ], config);
          }
          if (isPgEnum(chunk)) {
            if (chunk.schema) {
              return { sql: escapeName(chunk.schema) + "." + escapeName(chunk.enumName), params: [] };
            }
            return { sql: escapeName(chunk.enumName), params: [] };
          }
          if (isSQLWrapper(chunk)) {
            if (chunk.shouldOmitSQLParens?.()) {
              return this.buildQueryFromSourceParams([chunk.getSQL()], config);
            }
            return this.buildQueryFromSourceParams([
              new StringChunk("("),
              chunk.getSQL(),
              new StringChunk(")")
            ], config);
          }
          if (inlineParams) {
            return { sql: this.mapInlineParam(chunk, config), params: [] };
          }
          return { sql: escapeParam(paramStartIndex.value++, chunk), params: [chunk], typings: ["none"] };
        }));
      }
      mapInlineParam(chunk, { escapeString: escapeString2 }) {
        if (chunk === null) {
          return "null";
        }
        if (typeof chunk === "number" || typeof chunk === "boolean") {
          return chunk.toString();
        }
        if (typeof chunk === "string") {
          return escapeString2(chunk);
        }
        if (typeof chunk === "object") {
          const mappedValueAsString = chunk.toString();
          if (mappedValueAsString === "[object Object]") {
            return escapeString2(JSON.stringify(chunk));
          }
          return escapeString2(mappedValueAsString);
        }
        throw new Error("Unexpected param value: " + chunk);
      }
      getSQL() {
        return this;
      }
      as(alias) {
        if (alias === void 0) {
          return this;
        }
        return new _SQL.Aliased(this, alias);
      }
      mapWith(decoder2) {
        this.decoder = typeof decoder2 === "function" ? { mapFromDriverValue: decoder2 } : decoder2;
        return this;
      }
      inlineParams() {
        this.shouldInlineParams = true;
        return this;
      }
      /**
       * This method is used to conditionally include a part of the query.
       *
       * @param condition - Condition to check
       * @returns itself if the condition is `true`, otherwise `undefined`
       */
      if(condition) {
        return condition ? this : void 0;
      }
    };
    Name = class {
      static {
        __name(this, "Name");
      }
      constructor(value) {
        this.value = value;
      }
      static [entityKind] = "Name";
      brand;
      getSQL() {
        return new SQL([this]);
      }
    };
    __name(isDriverValueEncoder, "isDriverValueEncoder");
    noopDecoder = {
      mapFromDriverValue: /* @__PURE__ */ __name((value) => value, "mapFromDriverValue")
    };
    noopEncoder = {
      mapToDriverValue: /* @__PURE__ */ __name((value) => value, "mapToDriverValue")
    };
    noopMapper = {
      ...noopDecoder,
      ...noopEncoder
    };
    Param = class {
      static {
        __name(this, "Param");
      }
      /**
       * @param value - Parameter value
       * @param encoder - Encoder to convert the value to a driver parameter
       */
      constructor(value, encoder2 = noopEncoder) {
        this.value = value;
        this.encoder = encoder2;
      }
      static [entityKind] = "Param";
      brand;
      getSQL() {
        return new SQL([this]);
      }
    };
    __name(sql, "sql");
    ((sql2) => {
      function empty() {
        return new SQL([]);
      }
      __name(empty, "empty");
      sql2.empty = empty;
      function fromList(list) {
        return new SQL(list);
      }
      __name(fromList, "fromList");
      sql2.fromList = fromList;
      function raw(str) {
        return new SQL([new StringChunk(str)]);
      }
      __name(raw, "raw");
      sql2.raw = raw;
      function join(chunks, separator) {
        const result = [];
        for (const [i, chunk] of chunks.entries()) {
          if (i > 0 && separator !== void 0) {
            result.push(separator);
          }
          result.push(chunk);
        }
        return new SQL(result);
      }
      __name(join, "join");
      sql2.join = join;
      function identifier(value) {
        return new Name(value);
      }
      __name(identifier, "identifier");
      sql2.identifier = identifier;
      function placeholder2(name2) {
        return new Placeholder(name2);
      }
      __name(placeholder2, "placeholder2");
      sql2.placeholder = placeholder2;
      function param2(value, encoder2) {
        return new Param(value, encoder2);
      }
      __name(param2, "param2");
      sql2.param = param2;
    })(sql || (sql = {}));
    ((SQL2) => {
      class Aliased {
        static {
          __name(this, "Aliased");
        }
        constructor(sql2, fieldAlias) {
          this.sql = sql2;
          this.fieldAlias = fieldAlias;
        }
        static [entityKind] = "SQL.Aliased";
        /** @internal */
        isSelectionField = false;
        getSQL() {
          return this.sql;
        }
        /** @internal */
        clone() {
          return new Aliased(this.sql, this.fieldAlias);
        }
      }
      SQL2.Aliased = Aliased;
    })(SQL || (SQL = {}));
    Placeholder = class {
      static {
        __name(this, "Placeholder");
      }
      constructor(name2) {
        this.name = name2;
      }
      static [entityKind] = "Placeholder";
      getSQL() {
        return new SQL([this]);
      }
    };
    __name(fillPlaceholders, "fillPlaceholders");
    IsDrizzleView = /* @__PURE__ */ Symbol.for("drizzle:IsDrizzleView");
    View = class {
      static {
        __name(this, "View");
      }
      static [entityKind] = "View";
      /** @internal */
      [ViewBaseConfig];
      /** @internal */
      [IsDrizzleView] = true;
      constructor({ name: name2, schema, selectedFields, query }) {
        this[ViewBaseConfig] = {
          name: name2,
          originalName: name2,
          schema,
          selectedFields,
          query,
          isExisting: !query,
          isAlias: false
        };
      }
      getSQL() {
        return new SQL([this]);
      }
    };
    Column.prototype.getSQL = function() {
      return new SQL([this]);
    };
    Table.prototype.getSQL = function() {
      return new SQL([this]);
    };
    Subquery.prototype.getSQL = function() {
      return new SQL([this]);
    };
  }
});

// ../node_modules/drizzle-orm/utils.js
function mapResultRow(columns, row, joinsNotNullableMap) {
  const nullifyMap = {};
  const result = columns.reduce(
    (result2, { path, field }, columnIndex) => {
      let decoder2;
      if (is(field, Column)) {
        decoder2 = field;
      } else if (is(field, SQL)) {
        decoder2 = field.decoder;
      } else if (is(field, Subquery)) {
        decoder2 = field._.sql.decoder;
      } else {
        decoder2 = field.sql.decoder;
      }
      let node = result2;
      for (const [pathChunkIndex, pathChunk] of path.entries()) {
        if (pathChunkIndex < path.length - 1) {
          if (!(pathChunk in node)) {
            node[pathChunk] = {};
          }
          node = node[pathChunk];
        } else {
          const rawValue = row[columnIndex];
          const value = node[pathChunk] = rawValue === null ? null : decoder2.mapFromDriverValue(rawValue);
          if (joinsNotNullableMap && is(field, Column) && path.length === 2) {
            const objectName = path[0];
            if (!(objectName in nullifyMap)) {
              nullifyMap[objectName] = value === null ? getTableName(field.table) : false;
            } else if (typeof nullifyMap[objectName] === "string" && nullifyMap[objectName] !== getTableName(field.table)) {
              nullifyMap[objectName] = false;
            }
          }
        }
      }
      return result2;
    },
    {}
  );
  if (joinsNotNullableMap && Object.keys(nullifyMap).length > 0) {
    for (const [objectName, tableName] of Object.entries(nullifyMap)) {
      if (typeof tableName === "string" && !joinsNotNullableMap[tableName]) {
        result[objectName] = null;
      }
    }
  }
  return result;
}
function orderSelectedFields(fields, pathPrefix) {
  return Object.entries(fields).reduce((result, [name, field]) => {
    if (typeof name !== "string") {
      return result;
    }
    const newPath = pathPrefix ? [...pathPrefix, name] : [name];
    if (is(field, Column) || is(field, SQL) || is(field, SQL.Aliased) || is(field, Subquery)) {
      result.push({ path: newPath, field });
    } else if (is(field, Table)) {
      result.push(...orderSelectedFields(field[Table.Symbol.Columns], newPath));
    } else {
      result.push(...orderSelectedFields(field, newPath));
    }
    return result;
  }, []);
}
function haveSameKeys(left, right) {
  const leftKeys = Object.keys(left);
  const rightKeys = Object.keys(right);
  if (leftKeys.length !== rightKeys.length) {
    return false;
  }
  for (const [index2, key] of leftKeys.entries()) {
    if (key !== rightKeys[index2]) {
      return false;
    }
  }
  return true;
}
function mapUpdateSet(table, values) {
  const entries = Object.entries(values).filter(([, value]) => value !== void 0).map(([key, value]) => {
    if (is(value, SQL) || is(value, Column)) {
      return [key, value];
    } else {
      return [key, new Param(value, table[Table.Symbol.Columns][key])];
    }
  });
  if (entries.length === 0) {
    throw new Error("No values to set");
  }
  return Object.fromEntries(entries);
}
function applyMixins(baseClass, extendedClasses) {
  for (const extendedClass of extendedClasses) {
    for (const name of Object.getOwnPropertyNames(extendedClass.prototype)) {
      if (name === "constructor") continue;
      Object.defineProperty(
        baseClass.prototype,
        name,
        Object.getOwnPropertyDescriptor(extendedClass.prototype, name) || /* @__PURE__ */ Object.create(null)
      );
    }
  }
}
function getTableColumns(table) {
  return table[Table.Symbol.Columns];
}
function getTableLikeName(table) {
  return is(table, Subquery) ? table._.alias : is(table, View) ? table[ViewBaseConfig].name : is(table, SQL) ? void 0 : table[Table.Symbol.IsAlias] ? table[Table.Symbol.Name] : table[Table.Symbol.BaseName];
}
function getColumnNameAndConfig(a, b) {
  return {
    name: typeof a === "string" && a.length > 0 ? a : "",
    config: typeof a === "object" ? a : b
  };
}
var textDecoder;
var init_utils = __esm({
  "../node_modules/drizzle-orm/utils.js"() {
    init_functionsRoutes_0_4727514041666032();
    init_column();
    init_entity();
    init_sql();
    init_subquery();
    init_table();
    init_view_common();
    __name(mapResultRow, "mapResultRow");
    __name(orderSelectedFields, "orderSelectedFields");
    __name(haveSameKeys, "haveSameKeys");
    __name(mapUpdateSet, "mapUpdateSet");
    __name(applyMixins, "applyMixins");
    __name(getTableColumns, "getTableColumns");
    __name(getTableLikeName, "getTableLikeName");
    __name(getColumnNameAndConfig, "getColumnNameAndConfig");
    textDecoder = typeof TextDecoder === "undefined" ? null : new TextDecoder();
  }
});

// ../node_modules/drizzle-orm/pg-core/table.js
var InlineForeignKeys, EnableRLS, PgTable;
var init_table2 = __esm({
  "../node_modules/drizzle-orm/pg-core/table.js"() {
    init_functionsRoutes_0_4727514041666032();
    init_entity();
    init_table();
    InlineForeignKeys = /* @__PURE__ */ Symbol.for("drizzle:PgInlineForeignKeys");
    EnableRLS = /* @__PURE__ */ Symbol.for("drizzle:EnableRLS");
    PgTable = class extends Table {
      static {
        __name(this, "PgTable");
      }
      static [entityKind] = "PgTable";
      /** @internal */
      static Symbol = Object.assign({}, Table.Symbol, {
        InlineForeignKeys,
        EnableRLS
      });
      /**@internal */
      [InlineForeignKeys] = [];
      /** @internal */
      [EnableRLS] = false;
      /** @internal */
      [Table.Symbol.ExtraConfigBuilder] = void 0;
      /** @internal */
      [Table.Symbol.ExtraConfigColumns] = {};
    };
  }
});

// ../node_modules/drizzle-orm/pg-core/primary-keys.js
var PrimaryKeyBuilder, PrimaryKey;
var init_primary_keys = __esm({
  "../node_modules/drizzle-orm/pg-core/primary-keys.js"() {
    init_functionsRoutes_0_4727514041666032();
    init_entity();
    init_table2();
    PrimaryKeyBuilder = class {
      static {
        __name(this, "PrimaryKeyBuilder");
      }
      static [entityKind] = "PgPrimaryKeyBuilder";
      /** @internal */
      columns;
      /** @internal */
      name;
      constructor(columns, name) {
        this.columns = columns;
        this.name = name;
      }
      /** @internal */
      build(table) {
        return new PrimaryKey(table, this.columns, this.name);
      }
    };
    PrimaryKey = class {
      static {
        __name(this, "PrimaryKey");
      }
      constructor(table, columns, name) {
        this.table = table;
        this.columns = columns;
        this.name = name;
      }
      static [entityKind] = "PgPrimaryKey";
      columns;
      name;
      getName() {
        return this.name ?? `${this.table[PgTable.Symbol.Name]}_${this.columns.map((column) => column.name).join("_")}_pk`;
      }
    };
  }
});

// ../node_modules/drizzle-orm/sql/expressions/conditions.js
function bindIfParam(value, column) {
  if (isDriverValueEncoder(column) && !isSQLWrapper(value) && !is(value, Param) && !is(value, Placeholder) && !is(value, Column) && !is(value, Table) && !is(value, View)) {
    return new Param(value, column);
  }
  return value;
}
function and(...unfilteredConditions) {
  const conditions = unfilteredConditions.filter(
    (c) => c !== void 0
  );
  if (conditions.length === 0) {
    return void 0;
  }
  if (conditions.length === 1) {
    return new SQL(conditions);
  }
  return new SQL([
    new StringChunk("("),
    sql.join(conditions, new StringChunk(" and ")),
    new StringChunk(")")
  ]);
}
function or(...unfilteredConditions) {
  const conditions = unfilteredConditions.filter(
    (c) => c !== void 0
  );
  if (conditions.length === 0) {
    return void 0;
  }
  if (conditions.length === 1) {
    return new SQL(conditions);
  }
  return new SQL([
    new StringChunk("("),
    sql.join(conditions, new StringChunk(" or ")),
    new StringChunk(")")
  ]);
}
function not(condition) {
  return sql`not ${condition}`;
}
function inArray(column, values) {
  if (Array.isArray(values)) {
    if (values.length === 0) {
      return sql`false`;
    }
    return sql`${column} in ${values.map((v) => bindIfParam(v, column))}`;
  }
  return sql`${column} in ${bindIfParam(values, column)}`;
}
function notInArray(column, values) {
  if (Array.isArray(values)) {
    if (values.length === 0) {
      return sql`true`;
    }
    return sql`${column} not in ${values.map((v) => bindIfParam(v, column))}`;
  }
  return sql`${column} not in ${bindIfParam(values, column)}`;
}
function isNull(value) {
  return sql`${value} is null`;
}
function isNotNull(value) {
  return sql`${value} is not null`;
}
function exists(subquery) {
  return sql`exists ${subquery}`;
}
function notExists(subquery) {
  return sql`not exists ${subquery}`;
}
function between(column, min, max) {
  return sql`${column} between ${bindIfParam(min, column)} and ${bindIfParam(
    max,
    column
  )}`;
}
function notBetween(column, min, max) {
  return sql`${column} not between ${bindIfParam(
    min,
    column
  )} and ${bindIfParam(max, column)}`;
}
function like(column, value) {
  return sql`${column} like ${value}`;
}
function notLike(column, value) {
  return sql`${column} not like ${value}`;
}
function ilike(column, value) {
  return sql`${column} ilike ${value}`;
}
function notIlike(column, value) {
  return sql`${column} not ilike ${value}`;
}
var eq, ne, gt, gte, lt, lte;
var init_conditions = __esm({
  "../node_modules/drizzle-orm/sql/expressions/conditions.js"() {
    init_functionsRoutes_0_4727514041666032();
    init_column();
    init_entity();
    init_table();
    init_sql();
    __name(bindIfParam, "bindIfParam");
    eq = /* @__PURE__ */ __name((left, right) => {
      return sql`${left} = ${bindIfParam(right, left)}`;
    }, "eq");
    ne = /* @__PURE__ */ __name((left, right) => {
      return sql`${left} <> ${bindIfParam(right, left)}`;
    }, "ne");
    __name(and, "and");
    __name(or, "or");
    __name(not, "not");
    gt = /* @__PURE__ */ __name((left, right) => {
      return sql`${left} > ${bindIfParam(right, left)}`;
    }, "gt");
    gte = /* @__PURE__ */ __name((left, right) => {
      return sql`${left} >= ${bindIfParam(right, left)}`;
    }, "gte");
    lt = /* @__PURE__ */ __name((left, right) => {
      return sql`${left} < ${bindIfParam(right, left)}`;
    }, "lt");
    lte = /* @__PURE__ */ __name((left, right) => {
      return sql`${left} <= ${bindIfParam(right, left)}`;
    }, "lte");
    __name(inArray, "inArray");
    __name(notInArray, "notInArray");
    __name(isNull, "isNull");
    __name(isNotNull, "isNotNull");
    __name(exists, "exists");
    __name(notExists, "notExists");
    __name(between, "between");
    __name(notBetween, "notBetween");
    __name(like, "like");
    __name(notLike, "notLike");
    __name(ilike, "ilike");
    __name(notIlike, "notIlike");
  }
});

// ../node_modules/drizzle-orm/sql/expressions/select.js
function asc(column) {
  return sql`${column} asc`;
}
function desc(column) {
  return sql`${column} desc`;
}
var init_select = __esm({
  "../node_modules/drizzle-orm/sql/expressions/select.js"() {
    init_functionsRoutes_0_4727514041666032();
    init_sql();
    __name(asc, "asc");
    __name(desc, "desc");
  }
});

// ../node_modules/drizzle-orm/sql/expressions/index.js
var init_expressions = __esm({
  "../node_modules/drizzle-orm/sql/expressions/index.js"() {
    init_functionsRoutes_0_4727514041666032();
    init_conditions();
    init_select();
  }
});

// ../node_modules/drizzle-orm/relations.js
function getOperators() {
  return {
    and,
    between,
    eq,
    exists,
    gt,
    gte,
    ilike,
    inArray,
    isNull,
    isNotNull,
    like,
    lt,
    lte,
    ne,
    not,
    notBetween,
    notExists,
    notLike,
    notIlike,
    notInArray,
    or,
    sql
  };
}
function getOrderByOperators() {
  return {
    sql,
    asc,
    desc
  };
}
function extractTablesRelationalConfig(schema, configHelpers) {
  if (Object.keys(schema).length === 1 && "default" in schema && !is(schema["default"], Table)) {
    schema = schema["default"];
  }
  const tableNamesMap = {};
  const relationsBuffer = {};
  const tablesConfig = {};
  for (const [key, value] of Object.entries(schema)) {
    if (is(value, Table)) {
      const dbName = getTableUniqueName(value);
      const bufferedRelations = relationsBuffer[dbName];
      tableNamesMap[dbName] = key;
      tablesConfig[key] = {
        tsName: key,
        dbName: value[Table.Symbol.Name],
        schema: value[Table.Symbol.Schema],
        columns: value[Table.Symbol.Columns],
        relations: bufferedRelations?.relations ?? {},
        primaryKey: bufferedRelations?.primaryKey ?? []
      };
      for (const column of Object.values(
        value[Table.Symbol.Columns]
      )) {
        if (column.primary) {
          tablesConfig[key].primaryKey.push(column);
        }
      }
      const extraConfig = value[Table.Symbol.ExtraConfigBuilder]?.(value[Table.Symbol.ExtraConfigColumns]);
      if (extraConfig) {
        for (const configEntry of Object.values(extraConfig)) {
          if (is(configEntry, PrimaryKeyBuilder)) {
            tablesConfig[key].primaryKey.push(...configEntry.columns);
          }
        }
      }
    } else if (is(value, Relations)) {
      const dbName = getTableUniqueName(value.table);
      const tableName = tableNamesMap[dbName];
      const relations2 = value.config(
        configHelpers(value.table)
      );
      let primaryKey;
      for (const [relationName, relation] of Object.entries(relations2)) {
        if (tableName) {
          const tableConfig = tablesConfig[tableName];
          tableConfig.relations[relationName] = relation;
          if (primaryKey) {
            tableConfig.primaryKey.push(...primaryKey);
          }
        } else {
          if (!(dbName in relationsBuffer)) {
            relationsBuffer[dbName] = {
              relations: {},
              primaryKey
            };
          }
          relationsBuffer[dbName].relations[relationName] = relation;
        }
      }
    }
  }
  return { tables: tablesConfig, tableNamesMap };
}
function createOne(sourceTable) {
  return /* @__PURE__ */ __name(function one(table, config) {
    return new One(
      sourceTable,
      table,
      config,
      config?.fields.reduce((res, f) => res && f.notNull, true) ?? false
    );
  }, "one");
}
function createMany(sourceTable) {
  return /* @__PURE__ */ __name(function many(referencedTable, config) {
    return new Many(sourceTable, referencedTable, config);
  }, "many");
}
function normalizeRelation(schema, tableNamesMap, relation) {
  if (is(relation, One) && relation.config) {
    return {
      fields: relation.config.fields,
      references: relation.config.references
    };
  }
  const referencedTableTsName = tableNamesMap[getTableUniqueName(relation.referencedTable)];
  if (!referencedTableTsName) {
    throw new Error(
      `Table "${relation.referencedTable[Table.Symbol.Name]}" not found in schema`
    );
  }
  const referencedTableConfig = schema[referencedTableTsName];
  if (!referencedTableConfig) {
    throw new Error(`Table "${referencedTableTsName}" not found in schema`);
  }
  const sourceTable = relation.sourceTable;
  const sourceTableTsName = tableNamesMap[getTableUniqueName(sourceTable)];
  if (!sourceTableTsName) {
    throw new Error(
      `Table "${sourceTable[Table.Symbol.Name]}" not found in schema`
    );
  }
  const reverseRelations = [];
  for (const referencedTableRelation of Object.values(
    referencedTableConfig.relations
  )) {
    if (relation.relationName && relation !== referencedTableRelation && referencedTableRelation.relationName === relation.relationName || !relation.relationName && referencedTableRelation.referencedTable === relation.sourceTable) {
      reverseRelations.push(referencedTableRelation);
    }
  }
  if (reverseRelations.length > 1) {
    throw relation.relationName ? new Error(
      `There are multiple relations with name "${relation.relationName}" in table "${referencedTableTsName}"`
    ) : new Error(
      `There are multiple relations between "${referencedTableTsName}" and "${relation.sourceTable[Table.Symbol.Name]}". Please specify relation name`
    );
  }
  if (reverseRelations[0] && is(reverseRelations[0], One) && reverseRelations[0].config) {
    return {
      fields: reverseRelations[0].config.references,
      references: reverseRelations[0].config.fields
    };
  }
  throw new Error(
    `There is not enough information to infer relation "${sourceTableTsName}.${relation.fieldName}"`
  );
}
function createTableRelationsHelpers(sourceTable) {
  return {
    one: createOne(sourceTable),
    many: createMany(sourceTable)
  };
}
function mapRelationalRow(tablesConfig, tableConfig, row, buildQueryResultSelection, mapColumnValue = (value) => value) {
  const result = {};
  for (const [
    selectionItemIndex,
    selectionItem
  ] of buildQueryResultSelection.entries()) {
    if (selectionItem.isJson) {
      const relation = tableConfig.relations[selectionItem.tsKey];
      const rawSubRows = row[selectionItemIndex];
      const subRows = typeof rawSubRows === "string" ? JSON.parse(rawSubRows) : rawSubRows;
      result[selectionItem.tsKey] = is(relation, One) ? subRows && mapRelationalRow(
        tablesConfig,
        tablesConfig[selectionItem.relationTableTsKey],
        subRows,
        selectionItem.selection,
        mapColumnValue
      ) : subRows.map(
        (subRow) => mapRelationalRow(
          tablesConfig,
          tablesConfig[selectionItem.relationTableTsKey],
          subRow,
          selectionItem.selection,
          mapColumnValue
        )
      );
    } else {
      const value = mapColumnValue(row[selectionItemIndex]);
      const field = selectionItem.field;
      let decoder2;
      if (is(field, Column)) {
        decoder2 = field;
      } else if (is(field, SQL)) {
        decoder2 = field.decoder;
      } else {
        decoder2 = field.sql.decoder;
      }
      result[selectionItem.tsKey] = value === null ? null : decoder2.mapFromDriverValue(value);
    }
  }
  return result;
}
var Relation, Relations, One, Many;
var init_relations = __esm({
  "../node_modules/drizzle-orm/relations.js"() {
    init_functionsRoutes_0_4727514041666032();
    init_table();
    init_column();
    init_entity();
    init_primary_keys();
    init_expressions();
    init_sql();
    Relation = class {
      static {
        __name(this, "Relation");
      }
      constructor(sourceTable, referencedTable, relationName) {
        this.sourceTable = sourceTable;
        this.referencedTable = referencedTable;
        this.relationName = relationName;
        this.referencedTableName = referencedTable[Table.Symbol.Name];
      }
      static [entityKind] = "Relation";
      referencedTableName;
      fieldName;
    };
    Relations = class {
      static {
        __name(this, "Relations");
      }
      constructor(table, config) {
        this.table = table;
        this.config = config;
      }
      static [entityKind] = "Relations";
    };
    One = class _One extends Relation {
      static {
        __name(this, "One");
      }
      constructor(sourceTable, referencedTable, config, isNullable) {
        super(sourceTable, referencedTable, config?.relationName);
        this.config = config;
        this.isNullable = isNullable;
      }
      static [entityKind] = "One";
      withFieldName(fieldName) {
        const relation = new _One(
          this.sourceTable,
          this.referencedTable,
          this.config,
          this.isNullable
        );
        relation.fieldName = fieldName;
        return relation;
      }
    };
    Many = class _Many extends Relation {
      static {
        __name(this, "Many");
      }
      constructor(sourceTable, referencedTable, config) {
        super(sourceTable, referencedTable, config?.relationName);
        this.config = config;
      }
      static [entityKind] = "Many";
      withFieldName(fieldName) {
        const relation = new _Many(
          this.sourceTable,
          this.referencedTable,
          this.config
        );
        relation.fieldName = fieldName;
        return relation;
      }
    };
    __name(getOperators, "getOperators");
    __name(getOrderByOperators, "getOrderByOperators");
    __name(extractTablesRelationalConfig, "extractTablesRelationalConfig");
    __name(createOne, "createOne");
    __name(createMany, "createMany");
    __name(normalizeRelation, "normalizeRelation");
    __name(createTableRelationsHelpers, "createTableRelationsHelpers");
    __name(mapRelationalRow, "mapRelationalRow");
  }
});

// ../node_modules/drizzle-orm/alias.js
function aliasedTable(table, tableAlias) {
  return new Proxy(table, new TableAliasProxyHandler(tableAlias, false));
}
function aliasedTableColumn(column, tableAlias) {
  return new Proxy(
    column,
    new ColumnAliasProxyHandler(new Proxy(column.table, new TableAliasProxyHandler(tableAlias, false)))
  );
}
function mapColumnsInAliasedSQLToAlias(query, alias) {
  return new SQL.Aliased(mapColumnsInSQLToAlias(query.sql, alias), query.fieldAlias);
}
function mapColumnsInSQLToAlias(query, alias) {
  return sql.join(query.queryChunks.map((c) => {
    if (is(c, Column)) {
      return aliasedTableColumn(c, alias);
    }
    if (is(c, SQL)) {
      return mapColumnsInSQLToAlias(c, alias);
    }
    if (is(c, SQL.Aliased)) {
      return mapColumnsInAliasedSQLToAlias(c, alias);
    }
    return c;
  }));
}
var ColumnAliasProxyHandler, TableAliasProxyHandler, RelationTableAliasProxyHandler;
var init_alias = __esm({
  "../node_modules/drizzle-orm/alias.js"() {
    init_functionsRoutes_0_4727514041666032();
    init_column();
    init_entity();
    init_sql();
    init_table();
    init_view_common();
    ColumnAliasProxyHandler = class {
      static {
        __name(this, "ColumnAliasProxyHandler");
      }
      constructor(table) {
        this.table = table;
      }
      static [entityKind] = "ColumnAliasProxyHandler";
      get(columnObj, prop) {
        if (prop === "table") {
          return this.table;
        }
        return columnObj[prop];
      }
    };
    TableAliasProxyHandler = class {
      static {
        __name(this, "TableAliasProxyHandler");
      }
      constructor(alias, replaceOriginalName) {
        this.alias = alias;
        this.replaceOriginalName = replaceOriginalName;
      }
      static [entityKind] = "TableAliasProxyHandler";
      get(target, prop) {
        if (prop === Table.Symbol.IsAlias) {
          return true;
        }
        if (prop === Table.Symbol.Name) {
          return this.alias;
        }
        if (this.replaceOriginalName && prop === Table.Symbol.OriginalName) {
          return this.alias;
        }
        if (prop === ViewBaseConfig) {
          return {
            ...target[ViewBaseConfig],
            name: this.alias,
            isAlias: true
          };
        }
        if (prop === Table.Symbol.Columns) {
          const columns = target[Table.Symbol.Columns];
          if (!columns) {
            return columns;
          }
          const proxiedColumns = {};
          Object.keys(columns).map((key) => {
            proxiedColumns[key] = new Proxy(
              columns[key],
              new ColumnAliasProxyHandler(new Proxy(target, this))
            );
          });
          return proxiedColumns;
        }
        const value = target[prop];
        if (is(value, Column)) {
          return new Proxy(value, new ColumnAliasProxyHandler(new Proxy(target, this)));
        }
        return value;
      }
    };
    RelationTableAliasProxyHandler = class {
      static {
        __name(this, "RelationTableAliasProxyHandler");
      }
      constructor(alias) {
        this.alias = alias;
      }
      static [entityKind] = "RelationTableAliasProxyHandler";
      get(target, prop) {
        if (prop === "sourceTable") {
          return aliasedTable(target.sourceTable, this.alias);
        }
        return target[prop];
      }
    };
    __name(aliasedTable, "aliasedTable");
    __name(aliasedTableColumn, "aliasedTableColumn");
    __name(mapColumnsInAliasedSQLToAlias, "mapColumnsInAliasedSQLToAlias");
    __name(mapColumnsInSQLToAlias, "mapColumnsInSQLToAlias");
  }
});

// ../node_modules/drizzle-orm/selection-proxy.js
var SelectionProxyHandler;
var init_selection_proxy = __esm({
  "../node_modules/drizzle-orm/selection-proxy.js"() {
    init_functionsRoutes_0_4727514041666032();
    init_alias();
    init_column();
    init_entity();
    init_sql();
    init_subquery();
    init_view_common();
    SelectionProxyHandler = class _SelectionProxyHandler {
      static {
        __name(this, "SelectionProxyHandler");
      }
      static [entityKind] = "SelectionProxyHandler";
      config;
      constructor(config) {
        this.config = { ...config };
      }
      get(subquery, prop) {
        if (prop === "_") {
          return {
            ...subquery["_"],
            selectedFields: new Proxy(
              subquery._.selectedFields,
              this
            )
          };
        }
        if (prop === ViewBaseConfig) {
          return {
            ...subquery[ViewBaseConfig],
            selectedFields: new Proxy(
              subquery[ViewBaseConfig].selectedFields,
              this
            )
          };
        }
        if (typeof prop === "symbol") {
          return subquery[prop];
        }
        const columns = is(subquery, Subquery) ? subquery._.selectedFields : is(subquery, View) ? subquery[ViewBaseConfig].selectedFields : subquery;
        const value = columns[prop];
        if (is(value, SQL.Aliased)) {
          if (this.config.sqlAliasedBehavior === "sql" && !value.isSelectionField) {
            return value.sql;
          }
          const newValue = value.clone();
          newValue.isSelectionField = true;
          return newValue;
        }
        if (is(value, SQL)) {
          if (this.config.sqlBehavior === "sql") {
            return value;
          }
          throw new Error(
            `You tried to reference "${prop}" field from a subquery, which is a raw SQL field, but it doesn't have an alias declared. Please add an alias to the field using ".as('alias')" method.`
          );
        }
        if (is(value, Column)) {
          if (this.config.alias) {
            return new Proxy(
              value,
              new ColumnAliasProxyHandler(
                new Proxy(
                  value.table,
                  new TableAliasProxyHandler(this.config.alias, this.config.replaceOriginalName ?? false)
                )
              )
            );
          }
          return value;
        }
        if (typeof value !== "object" || value === null) {
          return value;
        }
        return new Proxy(value, new _SelectionProxyHandler(this.config));
      }
    };
  }
});

// ../node_modules/drizzle-orm/query-promise.js
var QueryPromise;
var init_query_promise = __esm({
  "../node_modules/drizzle-orm/query-promise.js"() {
    init_functionsRoutes_0_4727514041666032();
    init_entity();
    QueryPromise = class {
      static {
        __name(this, "QueryPromise");
      }
      static [entityKind] = "QueryPromise";
      [Symbol.toStringTag] = "QueryPromise";
      catch(onRejected) {
        return this.then(void 0, onRejected);
      }
      finally(onFinally) {
        return this.then(
          (value) => {
            onFinally?.();
            return value;
          },
          (reason) => {
            onFinally?.();
            throw reason;
          }
        );
      }
      then(onFulfilled, onRejected) {
        return this.execute().then(onFulfilled, onRejected);
      }
    };
  }
});

// ../node_modules/drizzle-orm/sqlite-core/foreign-keys.js
var ForeignKeyBuilder2, ForeignKey2;
var init_foreign_keys2 = __esm({
  "../node_modules/drizzle-orm/sqlite-core/foreign-keys.js"() {
    init_functionsRoutes_0_4727514041666032();
    init_entity();
    init_table_utils();
    ForeignKeyBuilder2 = class {
      static {
        __name(this, "ForeignKeyBuilder");
      }
      static [entityKind] = "SQLiteForeignKeyBuilder";
      /** @internal */
      reference;
      /** @internal */
      _onUpdate;
      /** @internal */
      _onDelete;
      constructor(config, actions) {
        this.reference = () => {
          const { name, columns, foreignColumns } = config();
          return { name, columns, foreignTable: foreignColumns[0].table, foreignColumns };
        };
        if (actions) {
          this._onUpdate = actions.onUpdate;
          this._onDelete = actions.onDelete;
        }
      }
      onUpdate(action) {
        this._onUpdate = action;
        return this;
      }
      onDelete(action) {
        this._onDelete = action;
        return this;
      }
      /** @internal */
      build(table) {
        return new ForeignKey2(table, this);
      }
    };
    ForeignKey2 = class {
      static {
        __name(this, "ForeignKey");
      }
      constructor(table, builder) {
        this.table = table;
        this.reference = builder.reference;
        this.onUpdate = builder._onUpdate;
        this.onDelete = builder._onDelete;
      }
      static [entityKind] = "SQLiteForeignKey";
      reference;
      onUpdate;
      onDelete;
      getName() {
        const { name, columns, foreignColumns } = this.reference();
        const columnNames = columns.map((column) => column.name);
        const foreignColumnNames = foreignColumns.map((column) => column.name);
        const chunks = [
          this.table[TableName],
          ...columnNames,
          foreignColumns[0].table[TableName],
          ...foreignColumnNames
        ];
        return name ?? `${chunks.join("_")}_fk`;
      }
    };
  }
});

// ../node_modules/drizzle-orm/sqlite-core/unique-constraint.js
function uniqueKeyName2(table, columns) {
  return `${table[TableName]}_${columns.join("_")}_unique`;
}
var UniqueConstraintBuilder2, UniqueOnConstraintBuilder2, UniqueConstraint2;
var init_unique_constraint2 = __esm({
  "../node_modules/drizzle-orm/sqlite-core/unique-constraint.js"() {
    init_functionsRoutes_0_4727514041666032();
    init_entity();
    init_table_utils();
    __name(uniqueKeyName2, "uniqueKeyName");
    UniqueConstraintBuilder2 = class {
      static {
        __name(this, "UniqueConstraintBuilder");
      }
      constructor(columns, name) {
        this.name = name;
        this.columns = columns;
      }
      static [entityKind] = "SQLiteUniqueConstraintBuilder";
      /** @internal */
      columns;
      /** @internal */
      build(table) {
        return new UniqueConstraint2(table, this.columns, this.name);
      }
    };
    UniqueOnConstraintBuilder2 = class {
      static {
        __name(this, "UniqueOnConstraintBuilder");
      }
      static [entityKind] = "SQLiteUniqueOnConstraintBuilder";
      /** @internal */
      name;
      constructor(name) {
        this.name = name;
      }
      on(...columns) {
        return new UniqueConstraintBuilder2(columns, this.name);
      }
    };
    UniqueConstraint2 = class {
      static {
        __name(this, "UniqueConstraint");
      }
      constructor(table, columns, name) {
        this.table = table;
        this.columns = columns;
        this.name = name ?? uniqueKeyName2(this.table, this.columns.map((column) => column.name));
      }
      static [entityKind] = "SQLiteUniqueConstraint";
      columns;
      name;
      getName() {
        return this.name;
      }
    };
  }
});

// ../node_modules/drizzle-orm/sqlite-core/columns/common.js
var SQLiteColumnBuilder, SQLiteColumn;
var init_common2 = __esm({
  "../node_modules/drizzle-orm/sqlite-core/columns/common.js"() {
    init_functionsRoutes_0_4727514041666032();
    init_column_builder();
    init_column();
    init_entity();
    init_foreign_keys2();
    init_unique_constraint2();
    SQLiteColumnBuilder = class extends ColumnBuilder {
      static {
        __name(this, "SQLiteColumnBuilder");
      }
      static [entityKind] = "SQLiteColumnBuilder";
      foreignKeyConfigs = [];
      references(ref, actions = {}) {
        this.foreignKeyConfigs.push({ ref, actions });
        return this;
      }
      unique(name) {
        this.config.isUnique = true;
        this.config.uniqueName = name;
        return this;
      }
      generatedAlwaysAs(as, config) {
        this.config.generated = {
          as,
          type: "always",
          mode: config?.mode ?? "virtual"
        };
        return this;
      }
      /** @internal */
      buildForeignKeys(column, table) {
        return this.foreignKeyConfigs.map(({ ref, actions }) => {
          return ((ref2, actions2) => {
            const builder = new ForeignKeyBuilder2(() => {
              const foreignColumn = ref2();
              return { columns: [column], foreignColumns: [foreignColumn] };
            });
            if (actions2.onUpdate) {
              builder.onUpdate(actions2.onUpdate);
            }
            if (actions2.onDelete) {
              builder.onDelete(actions2.onDelete);
            }
            return builder.build(table);
          })(ref, actions);
        });
      }
    };
    SQLiteColumn = class extends Column {
      static {
        __name(this, "SQLiteColumn");
      }
      constructor(table, config) {
        if (!config.uniqueName) {
          config.uniqueName = uniqueKeyName2(table, [config.name]);
        }
        super(table, config);
        this.table = table;
      }
      static [entityKind] = "SQLiteColumn";
    };
  }
});

// ../node_modules/drizzle-orm/sqlite-core/columns/blob.js
function blob(a, b) {
  const { name, config } = getColumnNameAndConfig(a, b);
  if (config?.mode === "json") {
    return new SQLiteBlobJsonBuilder(name);
  }
  if (config?.mode === "bigint") {
    return new SQLiteBigIntBuilder(name);
  }
  return new SQLiteBlobBufferBuilder(name);
}
var SQLiteBigIntBuilder, SQLiteBigInt, SQLiteBlobJsonBuilder, SQLiteBlobJson, SQLiteBlobBufferBuilder, SQLiteBlobBuffer;
var init_blob = __esm({
  "../node_modules/drizzle-orm/sqlite-core/columns/blob.js"() {
    init_functionsRoutes_0_4727514041666032();
    init_entity();
    init_utils();
    init_common2();
    SQLiteBigIntBuilder = class extends SQLiteColumnBuilder {
      static {
        __name(this, "SQLiteBigIntBuilder");
      }
      static [entityKind] = "SQLiteBigIntBuilder";
      constructor(name) {
        super(name, "bigint", "SQLiteBigInt");
      }
      /** @internal */
      build(table) {
        return new SQLiteBigInt(table, this.config);
      }
    };
    SQLiteBigInt = class extends SQLiteColumn {
      static {
        __name(this, "SQLiteBigInt");
      }
      static [entityKind] = "SQLiteBigInt";
      getSQLType() {
        return "blob";
      }
      mapFromDriverValue(value) {
        if (typeof Buffer !== "undefined" && Buffer.from) {
          const buf = Buffer.isBuffer(value) ? value : value instanceof ArrayBuffer ? Buffer.from(value) : value.buffer ? Buffer.from(value.buffer, value.byteOffset, value.byteLength) : Buffer.from(value);
          return BigInt(buf.toString("utf8"));
        }
        return BigInt(textDecoder.decode(value));
      }
      mapToDriverValue(value) {
        return Buffer.from(value.toString());
      }
    };
    SQLiteBlobJsonBuilder = class extends SQLiteColumnBuilder {
      static {
        __name(this, "SQLiteBlobJsonBuilder");
      }
      static [entityKind] = "SQLiteBlobJsonBuilder";
      constructor(name) {
        super(name, "json", "SQLiteBlobJson");
      }
      /** @internal */
      build(table) {
        return new SQLiteBlobJson(
          table,
          this.config
        );
      }
    };
    SQLiteBlobJson = class extends SQLiteColumn {
      static {
        __name(this, "SQLiteBlobJson");
      }
      static [entityKind] = "SQLiteBlobJson";
      getSQLType() {
        return "blob";
      }
      mapFromDriverValue(value) {
        if (typeof Buffer !== "undefined" && Buffer.from) {
          const buf = Buffer.isBuffer(value) ? value : value instanceof ArrayBuffer ? Buffer.from(value) : value.buffer ? Buffer.from(value.buffer, value.byteOffset, value.byteLength) : Buffer.from(value);
          return JSON.parse(buf.toString("utf8"));
        }
        return JSON.parse(textDecoder.decode(value));
      }
      mapToDriverValue(value) {
        return Buffer.from(JSON.stringify(value));
      }
    };
    SQLiteBlobBufferBuilder = class extends SQLiteColumnBuilder {
      static {
        __name(this, "SQLiteBlobBufferBuilder");
      }
      static [entityKind] = "SQLiteBlobBufferBuilder";
      constructor(name) {
        super(name, "buffer", "SQLiteBlobBuffer");
      }
      /** @internal */
      build(table) {
        return new SQLiteBlobBuffer(table, this.config);
      }
    };
    SQLiteBlobBuffer = class extends SQLiteColumn {
      static {
        __name(this, "SQLiteBlobBuffer");
      }
      static [entityKind] = "SQLiteBlobBuffer";
      mapFromDriverValue(value) {
        if (Buffer.isBuffer(value)) {
          return value;
        }
        return Buffer.from(value);
      }
      getSQLType() {
        return "blob";
      }
    };
    __name(blob, "blob");
  }
});

// ../node_modules/drizzle-orm/sqlite-core/columns/custom.js
function customType(customTypeParams) {
  return (a, b) => {
    const { name, config } = getColumnNameAndConfig(a, b);
    return new SQLiteCustomColumnBuilder(
      name,
      config,
      customTypeParams
    );
  };
}
var SQLiteCustomColumnBuilder, SQLiteCustomColumn;
var init_custom = __esm({
  "../node_modules/drizzle-orm/sqlite-core/columns/custom.js"() {
    init_functionsRoutes_0_4727514041666032();
    init_entity();
    init_utils();
    init_common2();
    SQLiteCustomColumnBuilder = class extends SQLiteColumnBuilder {
      static {
        __name(this, "SQLiteCustomColumnBuilder");
      }
      static [entityKind] = "SQLiteCustomColumnBuilder";
      constructor(name, fieldConfig, customTypeParams) {
        super(name, "custom", "SQLiteCustomColumn");
        this.config.fieldConfig = fieldConfig;
        this.config.customTypeParams = customTypeParams;
      }
      /** @internal */
      build(table) {
        return new SQLiteCustomColumn(
          table,
          this.config
        );
      }
    };
    SQLiteCustomColumn = class extends SQLiteColumn {
      static {
        __name(this, "SQLiteCustomColumn");
      }
      static [entityKind] = "SQLiteCustomColumn";
      sqlName;
      mapTo;
      mapFrom;
      constructor(table, config) {
        super(table, config);
        this.sqlName = config.customTypeParams.dataType(config.fieldConfig);
        this.mapTo = config.customTypeParams.toDriver;
        this.mapFrom = config.customTypeParams.fromDriver;
      }
      getSQLType() {
        return this.sqlName;
      }
      mapFromDriverValue(value) {
        return typeof this.mapFrom === "function" ? this.mapFrom(value) : value;
      }
      mapToDriverValue(value) {
        return typeof this.mapTo === "function" ? this.mapTo(value) : value;
      }
    };
    __name(customType, "customType");
  }
});

// ../node_modules/drizzle-orm/sqlite-core/columns/integer.js
function integer(a, b) {
  const { name, config } = getColumnNameAndConfig(a, b);
  if (config?.mode === "timestamp" || config?.mode === "timestamp_ms") {
    return new SQLiteTimestampBuilder(name, config.mode);
  }
  if (config?.mode === "boolean") {
    return new SQLiteBooleanBuilder(name, config.mode);
  }
  return new SQLiteIntegerBuilder(name);
}
var SQLiteBaseIntegerBuilder, SQLiteBaseInteger, SQLiteIntegerBuilder, SQLiteInteger, SQLiteTimestampBuilder, SQLiteTimestamp, SQLiteBooleanBuilder, SQLiteBoolean;
var init_integer = __esm({
  "../node_modules/drizzle-orm/sqlite-core/columns/integer.js"() {
    init_functionsRoutes_0_4727514041666032();
    init_entity();
    init_sql();
    init_utils();
    init_common2();
    SQLiteBaseIntegerBuilder = class extends SQLiteColumnBuilder {
      static {
        __name(this, "SQLiteBaseIntegerBuilder");
      }
      static [entityKind] = "SQLiteBaseIntegerBuilder";
      constructor(name, dataType, columnType) {
        super(name, dataType, columnType);
        this.config.autoIncrement = false;
      }
      primaryKey(config) {
        if (config?.autoIncrement) {
          this.config.autoIncrement = true;
        }
        this.config.hasDefault = true;
        return super.primaryKey();
      }
    };
    SQLiteBaseInteger = class extends SQLiteColumn {
      static {
        __name(this, "SQLiteBaseInteger");
      }
      static [entityKind] = "SQLiteBaseInteger";
      autoIncrement = this.config.autoIncrement;
      getSQLType() {
        return "integer";
      }
    };
    SQLiteIntegerBuilder = class extends SQLiteBaseIntegerBuilder {
      static {
        __name(this, "SQLiteIntegerBuilder");
      }
      static [entityKind] = "SQLiteIntegerBuilder";
      constructor(name) {
        super(name, "number", "SQLiteInteger");
      }
      build(table) {
        return new SQLiteInteger(
          table,
          this.config
        );
      }
    };
    SQLiteInteger = class extends SQLiteBaseInteger {
      static {
        __name(this, "SQLiteInteger");
      }
      static [entityKind] = "SQLiteInteger";
    };
    SQLiteTimestampBuilder = class extends SQLiteBaseIntegerBuilder {
      static {
        __name(this, "SQLiteTimestampBuilder");
      }
      static [entityKind] = "SQLiteTimestampBuilder";
      constructor(name, mode) {
        super(name, "date", "SQLiteTimestamp");
        this.config.mode = mode;
      }
      /**
       * @deprecated Use `default()` with your own expression instead.
       *
       * Adds `DEFAULT (cast((julianday('now') - 2440587.5)*86400000 as integer))` to the column, which is the current epoch timestamp in milliseconds.
       */
      defaultNow() {
        return this.default(sql`(cast((julianday('now') - 2440587.5)*86400000 as integer))`);
      }
      build(table) {
        return new SQLiteTimestamp(
          table,
          this.config
        );
      }
    };
    SQLiteTimestamp = class extends SQLiteBaseInteger {
      static {
        __name(this, "SQLiteTimestamp");
      }
      static [entityKind] = "SQLiteTimestamp";
      mode = this.config.mode;
      mapFromDriverValue(value) {
        if (this.config.mode === "timestamp") {
          return new Date(value * 1e3);
        }
        return new Date(value);
      }
      mapToDriverValue(value) {
        const unix = value.getTime();
        if (this.config.mode === "timestamp") {
          return Math.floor(unix / 1e3);
        }
        return unix;
      }
    };
    SQLiteBooleanBuilder = class extends SQLiteBaseIntegerBuilder {
      static {
        __name(this, "SQLiteBooleanBuilder");
      }
      static [entityKind] = "SQLiteBooleanBuilder";
      constructor(name, mode) {
        super(name, "boolean", "SQLiteBoolean");
        this.config.mode = mode;
      }
      build(table) {
        return new SQLiteBoolean(
          table,
          this.config
        );
      }
    };
    SQLiteBoolean = class extends SQLiteBaseInteger {
      static {
        __name(this, "SQLiteBoolean");
      }
      static [entityKind] = "SQLiteBoolean";
      mode = this.config.mode;
      mapFromDriverValue(value) {
        return Number(value) === 1;
      }
      mapToDriverValue(value) {
        return value ? 1 : 0;
      }
    };
    __name(integer, "integer");
  }
});

// ../node_modules/drizzle-orm/sqlite-core/columns/numeric.js
function numeric(a, b) {
  const { name, config } = getColumnNameAndConfig(a, b);
  const mode = config?.mode;
  return mode === "number" ? new SQLiteNumericNumberBuilder(name) : mode === "bigint" ? new SQLiteNumericBigIntBuilder(name) : new SQLiteNumericBuilder(name);
}
var SQLiteNumericBuilder, SQLiteNumeric, SQLiteNumericNumberBuilder, SQLiteNumericNumber, SQLiteNumericBigIntBuilder, SQLiteNumericBigInt;
var init_numeric = __esm({
  "../node_modules/drizzle-orm/sqlite-core/columns/numeric.js"() {
    init_functionsRoutes_0_4727514041666032();
    init_entity();
    init_utils();
    init_common2();
    SQLiteNumericBuilder = class extends SQLiteColumnBuilder {
      static {
        __name(this, "SQLiteNumericBuilder");
      }
      static [entityKind] = "SQLiteNumericBuilder";
      constructor(name) {
        super(name, "string", "SQLiteNumeric");
      }
      /** @internal */
      build(table) {
        return new SQLiteNumeric(
          table,
          this.config
        );
      }
    };
    SQLiteNumeric = class extends SQLiteColumn {
      static {
        __name(this, "SQLiteNumeric");
      }
      static [entityKind] = "SQLiteNumeric";
      mapFromDriverValue(value) {
        if (typeof value === "string") return value;
        return String(value);
      }
      getSQLType() {
        return "numeric";
      }
    };
    SQLiteNumericNumberBuilder = class extends SQLiteColumnBuilder {
      static {
        __name(this, "SQLiteNumericNumberBuilder");
      }
      static [entityKind] = "SQLiteNumericNumberBuilder";
      constructor(name) {
        super(name, "number", "SQLiteNumericNumber");
      }
      /** @internal */
      build(table) {
        return new SQLiteNumericNumber(
          table,
          this.config
        );
      }
    };
    SQLiteNumericNumber = class extends SQLiteColumn {
      static {
        __name(this, "SQLiteNumericNumber");
      }
      static [entityKind] = "SQLiteNumericNumber";
      mapFromDriverValue(value) {
        if (typeof value === "number") return value;
        return Number(value);
      }
      mapToDriverValue = String;
      getSQLType() {
        return "numeric";
      }
    };
    SQLiteNumericBigIntBuilder = class extends SQLiteColumnBuilder {
      static {
        __name(this, "SQLiteNumericBigIntBuilder");
      }
      static [entityKind] = "SQLiteNumericBigIntBuilder";
      constructor(name) {
        super(name, "bigint", "SQLiteNumericBigInt");
      }
      /** @internal */
      build(table) {
        return new SQLiteNumericBigInt(
          table,
          this.config
        );
      }
    };
    SQLiteNumericBigInt = class extends SQLiteColumn {
      static {
        __name(this, "SQLiteNumericBigInt");
      }
      static [entityKind] = "SQLiteNumericBigInt";
      mapFromDriverValue = BigInt;
      mapToDriverValue = String;
      getSQLType() {
        return "numeric";
      }
    };
    __name(numeric, "numeric");
  }
});

// ../node_modules/drizzle-orm/sqlite-core/columns/real.js
function real(name) {
  return new SQLiteRealBuilder(name ?? "");
}
var SQLiteRealBuilder, SQLiteReal;
var init_real = __esm({
  "../node_modules/drizzle-orm/sqlite-core/columns/real.js"() {
    init_functionsRoutes_0_4727514041666032();
    init_entity();
    init_common2();
    SQLiteRealBuilder = class extends SQLiteColumnBuilder {
      static {
        __name(this, "SQLiteRealBuilder");
      }
      static [entityKind] = "SQLiteRealBuilder";
      constructor(name) {
        super(name, "number", "SQLiteReal");
      }
      /** @internal */
      build(table) {
        return new SQLiteReal(table, this.config);
      }
    };
    SQLiteReal = class extends SQLiteColumn {
      static {
        __name(this, "SQLiteReal");
      }
      static [entityKind] = "SQLiteReal";
      getSQLType() {
        return "real";
      }
    };
    __name(real, "real");
  }
});

// ../node_modules/drizzle-orm/sqlite-core/columns/text.js
function text(a, b = {}) {
  const { name, config } = getColumnNameAndConfig(a, b);
  if (config.mode === "json") {
    return new SQLiteTextJsonBuilder(name);
  }
  return new SQLiteTextBuilder(name, config);
}
var SQLiteTextBuilder, SQLiteText, SQLiteTextJsonBuilder, SQLiteTextJson;
var init_text = __esm({
  "../node_modules/drizzle-orm/sqlite-core/columns/text.js"() {
    init_functionsRoutes_0_4727514041666032();
    init_entity();
    init_utils();
    init_common2();
    SQLiteTextBuilder = class extends SQLiteColumnBuilder {
      static {
        __name(this, "SQLiteTextBuilder");
      }
      static [entityKind] = "SQLiteTextBuilder";
      constructor(name, config) {
        super(name, "string", "SQLiteText");
        this.config.enumValues = config.enum;
        this.config.length = config.length;
      }
      /** @internal */
      build(table) {
        return new SQLiteText(
          table,
          this.config
        );
      }
    };
    SQLiteText = class extends SQLiteColumn {
      static {
        __name(this, "SQLiteText");
      }
      static [entityKind] = "SQLiteText";
      enumValues = this.config.enumValues;
      length = this.config.length;
      constructor(table, config) {
        super(table, config);
      }
      getSQLType() {
        return `text${this.config.length ? `(${this.config.length})` : ""}`;
      }
    };
    SQLiteTextJsonBuilder = class extends SQLiteColumnBuilder {
      static {
        __name(this, "SQLiteTextJsonBuilder");
      }
      static [entityKind] = "SQLiteTextJsonBuilder";
      constructor(name) {
        super(name, "json", "SQLiteTextJson");
      }
      /** @internal */
      build(table) {
        return new SQLiteTextJson(
          table,
          this.config
        );
      }
    };
    SQLiteTextJson = class extends SQLiteColumn {
      static {
        __name(this, "SQLiteTextJson");
      }
      static [entityKind] = "SQLiteTextJson";
      getSQLType() {
        return "text";
      }
      mapFromDriverValue(value) {
        return JSON.parse(value);
      }
      mapToDriverValue(value) {
        return JSON.stringify(value);
      }
    };
    __name(text, "text");
  }
});

// ../node_modules/drizzle-orm/sqlite-core/columns/all.js
function getSQLiteColumnBuilders() {
  return {
    blob,
    customType,
    integer,
    numeric,
    real,
    text
  };
}
var init_all = __esm({
  "../node_modules/drizzle-orm/sqlite-core/columns/all.js"() {
    init_functionsRoutes_0_4727514041666032();
    init_blob();
    init_custom();
    init_integer();
    init_numeric();
    init_real();
    init_text();
    __name(getSQLiteColumnBuilders, "getSQLiteColumnBuilders");
  }
});

// ../node_modules/drizzle-orm/sqlite-core/table.js
function sqliteTableBase(name, columns, extraConfig, schema, baseName = name) {
  const rawTable = new SQLiteTable(name, schema, baseName);
  const parsedColumns = typeof columns === "function" ? columns(getSQLiteColumnBuilders()) : columns;
  const builtColumns = Object.fromEntries(
    Object.entries(parsedColumns).map(([name2, colBuilderBase]) => {
      const colBuilder = colBuilderBase;
      colBuilder.setName(name2);
      const column = colBuilder.build(rawTable);
      rawTable[InlineForeignKeys2].push(...colBuilder.buildForeignKeys(column, rawTable));
      return [name2, column];
    })
  );
  const table = Object.assign(rawTable, builtColumns);
  table[Table.Symbol.Columns] = builtColumns;
  table[Table.Symbol.ExtraConfigColumns] = builtColumns;
  if (extraConfig) {
    table[SQLiteTable.Symbol.ExtraConfigBuilder] = extraConfig;
  }
  return table;
}
var InlineForeignKeys2, SQLiteTable, sqliteTable;
var init_table3 = __esm({
  "../node_modules/drizzle-orm/sqlite-core/table.js"() {
    init_functionsRoutes_0_4727514041666032();
    init_entity();
    init_table();
    init_all();
    InlineForeignKeys2 = /* @__PURE__ */ Symbol.for("drizzle:SQLiteInlineForeignKeys");
    SQLiteTable = class extends Table {
      static {
        __name(this, "SQLiteTable");
      }
      static [entityKind] = "SQLiteTable";
      /** @internal */
      static Symbol = Object.assign({}, Table.Symbol, {
        InlineForeignKeys: InlineForeignKeys2
      });
      /** @internal */
      [Table.Symbol.Columns];
      /** @internal */
      [InlineForeignKeys2] = [];
      /** @internal */
      [Table.Symbol.ExtraConfigBuilder] = void 0;
    };
    __name(sqliteTableBase, "sqliteTableBase");
    sqliteTable = /* @__PURE__ */ __name((name, columns, extraConfig) => {
      return sqliteTableBase(name, columns, extraConfig);
    }, "sqliteTable");
  }
});

// ../node_modules/drizzle-orm/sqlite-core/checks.js
var CheckBuilder, Check;
var init_checks = __esm({
  "../node_modules/drizzle-orm/sqlite-core/checks.js"() {
    init_functionsRoutes_0_4727514041666032();
    init_entity();
    CheckBuilder = class {
      static {
        __name(this, "CheckBuilder");
      }
      constructor(name, value) {
        this.name = name;
        this.value = value;
      }
      static [entityKind] = "SQLiteCheckBuilder";
      brand;
      build(table) {
        return new Check(table, this);
      }
    };
    Check = class {
      static {
        __name(this, "Check");
      }
      constructor(table, builder) {
        this.table = table;
        this.name = builder.name;
        this.value = builder.value;
      }
      static [entityKind] = "SQLiteCheck";
      name;
      value;
    };
  }
});

// ../node_modules/drizzle-orm/sqlite-core/indexes.js
function index(name) {
  return new IndexBuilderOn(name, false);
}
var IndexBuilderOn, IndexBuilder, Index;
var init_indexes = __esm({
  "../node_modules/drizzle-orm/sqlite-core/indexes.js"() {
    init_functionsRoutes_0_4727514041666032();
    init_entity();
    IndexBuilderOn = class {
      static {
        __name(this, "IndexBuilderOn");
      }
      constructor(name, unique) {
        this.name = name;
        this.unique = unique;
      }
      static [entityKind] = "SQLiteIndexBuilderOn";
      on(...columns) {
        return new IndexBuilder(this.name, columns, this.unique);
      }
    };
    IndexBuilder = class {
      static {
        __name(this, "IndexBuilder");
      }
      static [entityKind] = "SQLiteIndexBuilder";
      /** @internal */
      config;
      constructor(name, columns, unique) {
        this.config = {
          name,
          columns,
          unique,
          where: void 0
        };
      }
      /**
       * Condition for partial index.
       */
      where(condition) {
        this.config.where = condition;
        return this;
      }
      /** @internal */
      build(table) {
        return new Index(this.config, table);
      }
    };
    Index = class {
      static {
        __name(this, "Index");
      }
      static [entityKind] = "SQLiteIndex";
      config;
      constructor(config, table) {
        this.config = { ...config, table };
      }
    };
    __name(index, "index");
  }
});

// ../node_modules/drizzle-orm/sqlite-core/primary-keys.js
var PrimaryKeyBuilder2, PrimaryKey2;
var init_primary_keys2 = __esm({
  "../node_modules/drizzle-orm/sqlite-core/primary-keys.js"() {
    init_functionsRoutes_0_4727514041666032();
    init_entity();
    init_table3();
    PrimaryKeyBuilder2 = class {
      static {
        __name(this, "PrimaryKeyBuilder");
      }
      static [entityKind] = "SQLitePrimaryKeyBuilder";
      /** @internal */
      columns;
      /** @internal */
      name;
      constructor(columns, name) {
        this.columns = columns;
        this.name = name;
      }
      /** @internal */
      build(table) {
        return new PrimaryKey2(table, this.columns, this.name);
      }
    };
    PrimaryKey2 = class {
      static {
        __name(this, "PrimaryKey");
      }
      constructor(table, columns, name) {
        this.table = table;
        this.columns = columns;
        this.name = name;
      }
      static [entityKind] = "SQLitePrimaryKey";
      columns;
      name;
      getName() {
        return this.name ?? `${this.table[SQLiteTable.Symbol.Name]}_${this.columns.map((column) => column.name).join("_")}_pk`;
      }
    };
  }
});

// ../node_modules/drizzle-orm/sqlite-core/utils.js
function extractUsedTable(table) {
  if (is(table, SQLiteTable)) {
    return [`${table[Table.Symbol.BaseName]}`];
  }
  if (is(table, Subquery)) {
    return table._.usedTables ?? [];
  }
  if (is(table, SQL)) {
    return table.usedTables ?? [];
  }
  return [];
}
var init_utils2 = __esm({
  "../node_modules/drizzle-orm/sqlite-core/utils.js"() {
    init_functionsRoutes_0_4727514041666032();
    init_entity();
    init_sql();
    init_subquery();
    init_table();
    init_table3();
    __name(extractUsedTable, "extractUsedTable");
  }
});

// ../node_modules/drizzle-orm/sqlite-core/query-builders/delete.js
var SQLiteDeleteBase;
var init_delete = __esm({
  "../node_modules/drizzle-orm/sqlite-core/query-builders/delete.js"() {
    init_functionsRoutes_0_4727514041666032();
    init_entity();
    init_query_promise();
    init_selection_proxy();
    init_table3();
    init_table();
    init_utils();
    init_utils2();
    SQLiteDeleteBase = class extends QueryPromise {
      static {
        __name(this, "SQLiteDeleteBase");
      }
      constructor(table, session, dialect, withList) {
        super();
        this.table = table;
        this.session = session;
        this.dialect = dialect;
        this.config = { table, withList };
      }
      static [entityKind] = "SQLiteDelete";
      /** @internal */
      config;
      /**
       * Adds a `where` clause to the query.
       *
       * Calling this method will delete only those rows that fulfill a specified condition.
       *
       * See docs: {@link https://orm.drizzle.team/docs/delete}
       *
       * @param where the `where` clause.
       *
       * @example
       * You can use conditional operators and `sql function` to filter the rows to be deleted.
       *
       * ```ts
       * // Delete all cars with green color
       * db.delete(cars).where(eq(cars.color, 'green'));
       * // or
       * db.delete(cars).where(sql`${cars.color} = 'green'`)
       * ```
       *
       * You can logically combine conditional operators with `and()` and `or()` operators:
       *
       * ```ts
       * // Delete all BMW cars with a green color
       * db.delete(cars).where(and(eq(cars.color, 'green'), eq(cars.brand, 'BMW')));
       *
       * // Delete all cars with the green or blue color
       * db.delete(cars).where(or(eq(cars.color, 'green'), eq(cars.color, 'blue')));
       * ```
       */
      where(where) {
        this.config.where = where;
        return this;
      }
      orderBy(...columns) {
        if (typeof columns[0] === "function") {
          const orderBy = columns[0](
            new Proxy(
              this.config.table[Table.Symbol.Columns],
              new SelectionProxyHandler({ sqlAliasedBehavior: "alias", sqlBehavior: "sql" })
            )
          );
          const orderByArray = Array.isArray(orderBy) ? orderBy : [orderBy];
          this.config.orderBy = orderByArray;
        } else {
          const orderByArray = columns;
          this.config.orderBy = orderByArray;
        }
        return this;
      }
      limit(limit) {
        this.config.limit = limit;
        return this;
      }
      returning(fields = this.table[SQLiteTable.Symbol.Columns]) {
        this.config.returning = orderSelectedFields(fields);
        return this;
      }
      /** @internal */
      getSQL() {
        return this.dialect.buildDeleteQuery(this.config);
      }
      toSQL() {
        const { typings: _typings, ...rest } = this.dialect.sqlToQuery(this.getSQL());
        return rest;
      }
      /** @internal */
      _prepare(isOneTimeQuery = true) {
        return this.session[isOneTimeQuery ? "prepareOneTimeQuery" : "prepareQuery"](
          this.dialect.sqlToQuery(this.getSQL()),
          this.config.returning,
          this.config.returning ? "all" : "run",
          true,
          void 0,
          {
            type: "delete",
            tables: extractUsedTable(this.config.table)
          }
        );
      }
      prepare() {
        return this._prepare(false);
      }
      run = /* @__PURE__ */ __name((placeholderValues) => {
        return this._prepare().run(placeholderValues);
      }, "run");
      all = /* @__PURE__ */ __name((placeholderValues) => {
        return this._prepare().all(placeholderValues);
      }, "all");
      get = /* @__PURE__ */ __name((placeholderValues) => {
        return this._prepare().get(placeholderValues);
      }, "get");
      values = /* @__PURE__ */ __name((placeholderValues) => {
        return this._prepare().values(placeholderValues);
      }, "values");
      async execute(placeholderValues) {
        return this._prepare().execute(placeholderValues);
      }
      $dynamic() {
        return this;
      }
    };
  }
});

// ../node_modules/drizzle-orm/casing.js
function toSnakeCase(input) {
  const words = input.replace(/['\u2019]/g, "").match(/[\da-z]+|[A-Z]+(?![a-z])|[A-Z][\da-z]+/g) ?? [];
  return words.map((word) => word.toLowerCase()).join("_");
}
function toCamelCase(input) {
  const words = input.replace(/['\u2019]/g, "").match(/[\da-z]+|[A-Z]+(?![a-z])|[A-Z][\da-z]+/g) ?? [];
  return words.reduce((acc, word, i) => {
    const formattedWord = i === 0 ? word.toLowerCase() : `${word[0].toUpperCase()}${word.slice(1)}`;
    return acc + formattedWord;
  }, "");
}
function noopCase(input) {
  return input;
}
var CasingCache;
var init_casing = __esm({
  "../node_modules/drizzle-orm/casing.js"() {
    init_functionsRoutes_0_4727514041666032();
    init_entity();
    init_table();
    __name(toSnakeCase, "toSnakeCase");
    __name(toCamelCase, "toCamelCase");
    __name(noopCase, "noopCase");
    CasingCache = class {
      static {
        __name(this, "CasingCache");
      }
      static [entityKind] = "CasingCache";
      /** @internal */
      cache = {};
      cachedTables = {};
      convert;
      constructor(casing) {
        this.convert = casing === "snake_case" ? toSnakeCase : casing === "camelCase" ? toCamelCase : noopCase;
      }
      getColumnCasing(column) {
        if (!column.keyAsName) return column.name;
        const schema = column.table[Table.Symbol.Schema] ?? "public";
        const tableName = column.table[Table.Symbol.OriginalName];
        const key = `${schema}.${tableName}.${column.name}`;
        if (!this.cache[key]) {
          this.cacheTable(column.table);
        }
        return this.cache[key];
      }
      cacheTable(table) {
        const schema = table[Table.Symbol.Schema] ?? "public";
        const tableName = table[Table.Symbol.OriginalName];
        const tableKey = `${schema}.${tableName}`;
        if (!this.cachedTables[tableKey]) {
          for (const column of Object.values(table[Table.Symbol.Columns])) {
            const columnKey = `${tableKey}.${column.name}`;
            this.cache[columnKey] = this.convert(column.name);
          }
          this.cachedTables[tableKey] = true;
        }
      }
      clearCache() {
        this.cache = {};
        this.cachedTables = {};
      }
    };
  }
});

// ../node_modules/drizzle-orm/errors.js
var DrizzleError, DrizzleQueryError, TransactionRollbackError;
var init_errors = __esm({
  "../node_modules/drizzle-orm/errors.js"() {
    init_functionsRoutes_0_4727514041666032();
    init_entity();
    DrizzleError = class extends Error {
      static {
        __name(this, "DrizzleError");
      }
      static [entityKind] = "DrizzleError";
      constructor({ message: message2, cause }) {
        super(message2);
        this.name = "DrizzleError";
        this.cause = cause;
      }
    };
    DrizzleQueryError = class _DrizzleQueryError extends Error {
      static {
        __name(this, "DrizzleQueryError");
      }
      constructor(query, params, cause) {
        super(`Failed query: ${query}
params: ${params}`);
        this.query = query;
        this.params = params;
        this.cause = cause;
        Error.captureStackTrace(this, _DrizzleQueryError);
        if (cause) this.cause = cause;
      }
    };
    TransactionRollbackError = class extends DrizzleError {
      static {
        __name(this, "TransactionRollbackError");
      }
      static [entityKind] = "TransactionRollbackError";
      constructor() {
        super({ message: "Rollback" });
      }
    };
  }
});

// ../node_modules/drizzle-orm/sql/functions/aggregate.js
var init_aggregate = __esm({
  "../node_modules/drizzle-orm/sql/functions/aggregate.js"() {
    init_functionsRoutes_0_4727514041666032();
  }
});

// ../node_modules/drizzle-orm/sql/functions/vector.js
var init_vector = __esm({
  "../node_modules/drizzle-orm/sql/functions/vector.js"() {
    init_functionsRoutes_0_4727514041666032();
  }
});

// ../node_modules/drizzle-orm/sql/functions/index.js
var init_functions = __esm({
  "../node_modules/drizzle-orm/sql/functions/index.js"() {
    init_functionsRoutes_0_4727514041666032();
    init_aggregate();
    init_vector();
  }
});

// ../node_modules/drizzle-orm/sql/index.js
var init_sql2 = __esm({
  "../node_modules/drizzle-orm/sql/index.js"() {
    init_functionsRoutes_0_4727514041666032();
    init_expressions();
    init_functions();
    init_sql();
  }
});

// ../node_modules/drizzle-orm/sqlite-core/columns/index.js
var init_columns = __esm({
  "../node_modules/drizzle-orm/sqlite-core/columns/index.js"() {
    init_functionsRoutes_0_4727514041666032();
    init_blob();
    init_common2();
    init_custom();
    init_integer();
    init_numeric();
    init_real();
    init_text();
  }
});

// ../node_modules/drizzle-orm/sqlite-core/view-base.js
var SQLiteViewBase;
var init_view_base = __esm({
  "../node_modules/drizzle-orm/sqlite-core/view-base.js"() {
    init_functionsRoutes_0_4727514041666032();
    init_entity();
    init_sql();
    SQLiteViewBase = class extends View {
      static {
        __name(this, "SQLiteViewBase");
      }
      static [entityKind] = "SQLiteViewBase";
    };
  }
});

// ../node_modules/drizzle-orm/sqlite-core/dialect.js
var SQLiteDialect, SQLiteSyncDialect, SQLiteAsyncDialect;
var init_dialect = __esm({
  "../node_modules/drizzle-orm/sqlite-core/dialect.js"() {
    init_functionsRoutes_0_4727514041666032();
    init_alias();
    init_casing();
    init_column();
    init_entity();
    init_errors();
    init_relations();
    init_sql2();
    init_sql();
    init_columns();
    init_table3();
    init_subquery();
    init_table();
    init_utils();
    init_view_common();
    init_view_base();
    SQLiteDialect = class {
      static {
        __name(this, "SQLiteDialect");
      }
      static [entityKind] = "SQLiteDialect";
      /** @internal */
      casing;
      constructor(config) {
        this.casing = new CasingCache(config?.casing);
      }
      escapeName(name) {
        return `"${name}"`;
      }
      escapeParam(_num) {
        return "?";
      }
      escapeString(str) {
        return `'${str.replace(/'/g, "''")}'`;
      }
      buildWithCTE(queries) {
        if (!queries?.length) return void 0;
        const withSqlChunks = [sql`with `];
        for (const [i, w] of queries.entries()) {
          withSqlChunks.push(sql`${sql.identifier(w._.alias)} as (${w._.sql})`);
          if (i < queries.length - 1) {
            withSqlChunks.push(sql`, `);
          }
        }
        withSqlChunks.push(sql` `);
        return sql.join(withSqlChunks);
      }
      buildDeleteQuery({ table, where, returning, withList, limit, orderBy }) {
        const withSql = this.buildWithCTE(withList);
        const returningSql = returning ? sql` returning ${this.buildSelection(returning, { isSingleTable: true })}` : void 0;
        const whereSql = where ? sql` where ${where}` : void 0;
        const orderBySql = this.buildOrderBy(orderBy);
        const limitSql = this.buildLimit(limit);
        return sql`${withSql}delete from ${table}${whereSql}${returningSql}${orderBySql}${limitSql}`;
      }
      buildUpdateSet(table, set) {
        const tableColumns = table[Table.Symbol.Columns];
        const columnNames = Object.keys(tableColumns).filter(
          (colName) => set[colName] !== void 0 || tableColumns[colName]?.onUpdateFn !== void 0
        );
        const setSize = columnNames.length;
        return sql.join(columnNames.flatMap((colName, i) => {
          const col = tableColumns[colName];
          const onUpdateFnResult = col.onUpdateFn?.();
          const value = set[colName] ?? (is(onUpdateFnResult, SQL) ? onUpdateFnResult : sql.param(onUpdateFnResult, col));
          const res = sql`${sql.identifier(this.casing.getColumnCasing(col))} = ${value}`;
          if (i < setSize - 1) {
            return [res, sql.raw(", ")];
          }
          return [res];
        }));
      }
      buildUpdateQuery({ table, set, where, returning, withList, joins, from, limit, orderBy }) {
        const withSql = this.buildWithCTE(withList);
        const setSql = this.buildUpdateSet(table, set);
        const fromSql = from && sql.join([sql.raw(" from "), this.buildFromTable(from)]);
        const joinsSql = this.buildJoins(joins);
        const returningSql = returning ? sql` returning ${this.buildSelection(returning, { isSingleTable: true })}` : void 0;
        const whereSql = where ? sql` where ${where}` : void 0;
        const orderBySql = this.buildOrderBy(orderBy);
        const limitSql = this.buildLimit(limit);
        return sql`${withSql}update ${table} set ${setSql}${fromSql}${joinsSql}${whereSql}${returningSql}${orderBySql}${limitSql}`;
      }
      /**
       * Builds selection SQL with provided fields/expressions
       *
       * Examples:
       *
       * `select <selection> from`
       *
       * `insert ... returning <selection>`
       *
       * If `isSingleTable` is true, then columns won't be prefixed with table name
       */
      buildSelection(fields, { isSingleTable = false } = {}) {
        const columnsLen = fields.length;
        const chunks = fields.flatMap(({ field }, i) => {
          const chunk = [];
          if (is(field, SQL.Aliased) && field.isSelectionField) {
            chunk.push(sql.identifier(field.fieldAlias));
          } else if (is(field, SQL.Aliased) || is(field, SQL)) {
            const query = is(field, SQL.Aliased) ? field.sql : field;
            if (isSingleTable) {
              chunk.push(
                new SQL(
                  query.queryChunks.map((c) => {
                    if (is(c, Column)) {
                      return sql.identifier(this.casing.getColumnCasing(c));
                    }
                    return c;
                  })
                )
              );
            } else {
              chunk.push(query);
            }
            if (is(field, SQL.Aliased)) {
              chunk.push(sql` as ${sql.identifier(field.fieldAlias)}`);
            }
          } else if (is(field, Column)) {
            const tableName = field.table[Table.Symbol.Name];
            if (field.columnType === "SQLiteNumericBigInt") {
              if (isSingleTable) {
                chunk.push(sql`cast(${sql.identifier(this.casing.getColumnCasing(field))} as text)`);
              } else {
                chunk.push(
                  sql`cast(${sql.identifier(tableName)}.${sql.identifier(this.casing.getColumnCasing(field))} as text)`
                );
              }
            } else {
              if (isSingleTable) {
                chunk.push(sql.identifier(this.casing.getColumnCasing(field)));
              } else {
                chunk.push(sql`${sql.identifier(tableName)}.${sql.identifier(this.casing.getColumnCasing(field))}`);
              }
            }
          } else if (is(field, Subquery)) {
            const entries = Object.entries(field._.selectedFields);
            if (entries.length === 1) {
              const entry = entries[0][1];
              const fieldDecoder = is(entry, SQL) ? entry.decoder : is(entry, Column) ? { mapFromDriverValue: /* @__PURE__ */ __name((v) => entry.mapFromDriverValue(v), "mapFromDriverValue") } : entry.sql.decoder;
              if (fieldDecoder) field._.sql.decoder = fieldDecoder;
            }
            chunk.push(field);
          }
          if (i < columnsLen - 1) {
            chunk.push(sql`, `);
          }
          return chunk;
        });
        return sql.join(chunks);
      }
      buildJoins(joins) {
        if (!joins || joins.length === 0) {
          return void 0;
        }
        const joinsArray = [];
        if (joins) {
          for (const [index2, joinMeta] of joins.entries()) {
            if (index2 === 0) {
              joinsArray.push(sql` `);
            }
            const table = joinMeta.table;
            const onSql = joinMeta.on ? sql` on ${joinMeta.on}` : void 0;
            if (is(table, SQLiteTable)) {
              const tableName = table[SQLiteTable.Symbol.Name];
              const tableSchema = table[SQLiteTable.Symbol.Schema];
              const origTableName = table[SQLiteTable.Symbol.OriginalName];
              const alias = tableName === origTableName ? void 0 : joinMeta.alias;
              joinsArray.push(
                sql`${sql.raw(joinMeta.joinType)} join ${tableSchema ? sql`${sql.identifier(tableSchema)}.` : void 0}${sql.identifier(origTableName)}${alias && sql` ${sql.identifier(alias)}`}${onSql}`
              );
            } else {
              joinsArray.push(
                sql`${sql.raw(joinMeta.joinType)} join ${table}${onSql}`
              );
            }
            if (index2 < joins.length - 1) {
              joinsArray.push(sql` `);
            }
          }
        }
        return sql.join(joinsArray);
      }
      buildLimit(limit) {
        return typeof limit === "object" || typeof limit === "number" && limit >= 0 ? sql` limit ${limit}` : void 0;
      }
      buildOrderBy(orderBy) {
        const orderByList = [];
        if (orderBy) {
          for (const [index2, orderByValue] of orderBy.entries()) {
            orderByList.push(orderByValue);
            if (index2 < orderBy.length - 1) {
              orderByList.push(sql`, `);
            }
          }
        }
        return orderByList.length > 0 ? sql` order by ${sql.join(orderByList)}` : void 0;
      }
      buildFromTable(table) {
        if (is(table, Table) && table[Table.Symbol.IsAlias]) {
          return sql`${sql`${sql.identifier(table[Table.Symbol.Schema] ?? "")}.`.if(table[Table.Symbol.Schema])}${sql.identifier(table[Table.Symbol.OriginalName])} ${sql.identifier(table[Table.Symbol.Name])}`;
        }
        return table;
      }
      buildSelectQuery({
        withList,
        fields,
        fieldsFlat,
        where,
        having,
        table,
        joins,
        orderBy,
        groupBy,
        limit,
        offset,
        distinct,
        setOperators
      }) {
        const fieldsList = fieldsFlat ?? orderSelectedFields(fields);
        for (const f of fieldsList) {
          if (is(f.field, Column) && getTableName(f.field.table) !== (is(table, Subquery) ? table._.alias : is(table, SQLiteViewBase) ? table[ViewBaseConfig].name : is(table, SQL) ? void 0 : getTableName(table)) && !((table2) => joins?.some(
            ({ alias }) => alias === (table2[Table.Symbol.IsAlias] ? getTableName(table2) : table2[Table.Symbol.BaseName])
          ))(f.field.table)) {
            const tableName = getTableName(f.field.table);
            throw new Error(
              `Your "${f.path.join("->")}" field references a column "${tableName}"."${f.field.name}", but the table "${tableName}" is not part of the query! Did you forget to join it?`
            );
          }
        }
        const isSingleTable = !joins || joins.length === 0;
        const withSql = this.buildWithCTE(withList);
        const distinctSql = distinct ? sql` distinct` : void 0;
        const selection = this.buildSelection(fieldsList, { isSingleTable });
        const tableSql = this.buildFromTable(table);
        const joinsSql = this.buildJoins(joins);
        const whereSql = where ? sql` where ${where}` : void 0;
        const havingSql = having ? sql` having ${having}` : void 0;
        const groupByList = [];
        if (groupBy) {
          for (const [index2, groupByValue] of groupBy.entries()) {
            groupByList.push(groupByValue);
            if (index2 < groupBy.length - 1) {
              groupByList.push(sql`, `);
            }
          }
        }
        const groupBySql = groupByList.length > 0 ? sql` group by ${sql.join(groupByList)}` : void 0;
        const orderBySql = this.buildOrderBy(orderBy);
        const limitSql = this.buildLimit(limit);
        const offsetSql = offset ? sql` offset ${offset}` : void 0;
        const finalQuery = sql`${withSql}select${distinctSql} ${selection} from ${tableSql}${joinsSql}${whereSql}${groupBySql}${havingSql}${orderBySql}${limitSql}${offsetSql}`;
        if (setOperators.length > 0) {
          return this.buildSetOperations(finalQuery, setOperators);
        }
        return finalQuery;
      }
      buildSetOperations(leftSelect, setOperators) {
        const [setOperator, ...rest] = setOperators;
        if (!setOperator) {
          throw new Error("Cannot pass undefined values to any set operator");
        }
        if (rest.length === 0) {
          return this.buildSetOperationQuery({ leftSelect, setOperator });
        }
        return this.buildSetOperations(
          this.buildSetOperationQuery({ leftSelect, setOperator }),
          rest
        );
      }
      buildSetOperationQuery({
        leftSelect,
        setOperator: { type, isAll, rightSelect, limit, orderBy, offset }
      }) {
        const leftChunk = sql`${leftSelect.getSQL()} `;
        const rightChunk = sql`${rightSelect.getSQL()}`;
        let orderBySql;
        if (orderBy && orderBy.length > 0) {
          const orderByValues = [];
          for (const singleOrderBy of orderBy) {
            if (is(singleOrderBy, SQLiteColumn)) {
              orderByValues.push(sql.identifier(singleOrderBy.name));
            } else if (is(singleOrderBy, SQL)) {
              for (let i = 0; i < singleOrderBy.queryChunks.length; i++) {
                const chunk = singleOrderBy.queryChunks[i];
                if (is(chunk, SQLiteColumn)) {
                  singleOrderBy.queryChunks[i] = sql.identifier(this.casing.getColumnCasing(chunk));
                }
              }
              orderByValues.push(sql`${singleOrderBy}`);
            } else {
              orderByValues.push(sql`${singleOrderBy}`);
            }
          }
          orderBySql = sql` order by ${sql.join(orderByValues, sql`, `)}`;
        }
        const limitSql = typeof limit === "object" || typeof limit === "number" && limit >= 0 ? sql` limit ${limit}` : void 0;
        const operatorChunk = sql.raw(`${type} ${isAll ? "all " : ""}`);
        const offsetSql = offset ? sql` offset ${offset}` : void 0;
        return sql`${leftChunk}${operatorChunk}${rightChunk}${orderBySql}${limitSql}${offsetSql}`;
      }
      buildInsertQuery({ table, values: valuesOrSelect, onConflict, returning, withList, select }) {
        const valuesSqlList = [];
        const columns = table[Table.Symbol.Columns];
        const colEntries = Object.entries(columns).filter(
          ([_, col]) => !col.shouldDisableInsert()
        );
        const insertOrder = colEntries.map(([, column]) => sql.identifier(this.casing.getColumnCasing(column)));
        if (select) {
          const select2 = valuesOrSelect;
          if (is(select2, SQL)) {
            valuesSqlList.push(select2);
          } else {
            valuesSqlList.push(select2.getSQL());
          }
        } else {
          const values = valuesOrSelect;
          valuesSqlList.push(sql.raw("values "));
          for (const [valueIndex, value] of values.entries()) {
            const valueList = [];
            for (const [fieldName, col] of colEntries) {
              const colValue = value[fieldName];
              if (colValue === void 0 || is(colValue, Param) && colValue.value === void 0) {
                let defaultValue;
                if (col.default !== null && col.default !== void 0) {
                  defaultValue = is(col.default, SQL) ? col.default : sql.param(col.default, col);
                } else if (col.defaultFn !== void 0) {
                  const defaultFnResult = col.defaultFn();
                  defaultValue = is(defaultFnResult, SQL) ? defaultFnResult : sql.param(defaultFnResult, col);
                } else if (!col.default && col.onUpdateFn !== void 0) {
                  const onUpdateFnResult = col.onUpdateFn();
                  defaultValue = is(onUpdateFnResult, SQL) ? onUpdateFnResult : sql.param(onUpdateFnResult, col);
                } else {
                  defaultValue = sql`null`;
                }
                valueList.push(defaultValue);
              } else {
                valueList.push(colValue);
              }
            }
            valuesSqlList.push(valueList);
            if (valueIndex < values.length - 1) {
              valuesSqlList.push(sql`, `);
            }
          }
        }
        const withSql = this.buildWithCTE(withList);
        const valuesSql = sql.join(valuesSqlList);
        const returningSql = returning ? sql` returning ${this.buildSelection(returning, { isSingleTable: true })}` : void 0;
        const onConflictSql = onConflict?.length ? sql.join(onConflict) : void 0;
        return sql`${withSql}insert into ${table} ${insertOrder} ${valuesSql}${onConflictSql}${returningSql}`;
      }
      sqlToQuery(sql2, invokeSource) {
        return sql2.toQuery({
          casing: this.casing,
          escapeName: this.escapeName,
          escapeParam: this.escapeParam,
          escapeString: this.escapeString,
          invokeSource
        });
      }
      buildRelationalQuery({
        fullSchema,
        schema,
        tableNamesMap,
        table,
        tableConfig,
        queryConfig: config,
        tableAlias,
        nestedQueryRelation,
        joinOn
      }) {
        let selection = [];
        let limit, offset, orderBy = [], where;
        const joins = [];
        if (config === true) {
          const selectionEntries = Object.entries(tableConfig.columns);
          selection = selectionEntries.map(([key, value]) => ({
            dbKey: value.name,
            tsKey: key,
            field: aliasedTableColumn(value, tableAlias),
            relationTableTsKey: void 0,
            isJson: false,
            selection: []
          }));
        } else {
          const aliasedColumns = Object.fromEntries(
            Object.entries(tableConfig.columns).map(([key, value]) => [key, aliasedTableColumn(value, tableAlias)])
          );
          if (config.where) {
            const whereSql = typeof config.where === "function" ? config.where(aliasedColumns, getOperators()) : config.where;
            where = whereSql && mapColumnsInSQLToAlias(whereSql, tableAlias);
          }
          const fieldsSelection = [];
          let selectedColumns = [];
          if (config.columns) {
            let isIncludeMode = false;
            for (const [field, value] of Object.entries(config.columns)) {
              if (value === void 0) {
                continue;
              }
              if (field in tableConfig.columns) {
                if (!isIncludeMode && value === true) {
                  isIncludeMode = true;
                }
                selectedColumns.push(field);
              }
            }
            if (selectedColumns.length > 0) {
              selectedColumns = isIncludeMode ? selectedColumns.filter((c) => config.columns?.[c] === true) : Object.keys(tableConfig.columns).filter((key) => !selectedColumns.includes(key));
            }
          } else {
            selectedColumns = Object.keys(tableConfig.columns);
          }
          for (const field of selectedColumns) {
            const column = tableConfig.columns[field];
            fieldsSelection.push({ tsKey: field, value: column });
          }
          let selectedRelations = [];
          if (config.with) {
            selectedRelations = Object.entries(config.with).filter((entry) => !!entry[1]).map(([tsKey, queryConfig]) => ({ tsKey, queryConfig, relation: tableConfig.relations[tsKey] }));
          }
          let extras;
          if (config.extras) {
            extras = typeof config.extras === "function" ? config.extras(aliasedColumns, { sql }) : config.extras;
            for (const [tsKey, value] of Object.entries(extras)) {
              fieldsSelection.push({
                tsKey,
                value: mapColumnsInAliasedSQLToAlias(value, tableAlias)
              });
            }
          }
          for (const { tsKey, value } of fieldsSelection) {
            selection.push({
              dbKey: is(value, SQL.Aliased) ? value.fieldAlias : tableConfig.columns[tsKey].name,
              tsKey,
              field: is(value, Column) ? aliasedTableColumn(value, tableAlias) : value,
              relationTableTsKey: void 0,
              isJson: false,
              selection: []
            });
          }
          let orderByOrig = typeof config.orderBy === "function" ? config.orderBy(aliasedColumns, getOrderByOperators()) : config.orderBy ?? [];
          if (!Array.isArray(orderByOrig)) {
            orderByOrig = [orderByOrig];
          }
          orderBy = orderByOrig.map((orderByValue) => {
            if (is(orderByValue, Column)) {
              return aliasedTableColumn(orderByValue, tableAlias);
            }
            return mapColumnsInSQLToAlias(orderByValue, tableAlias);
          });
          limit = config.limit;
          offset = config.offset;
          for (const {
            tsKey: selectedRelationTsKey,
            queryConfig: selectedRelationConfigValue,
            relation
          } of selectedRelations) {
            const normalizedRelation = normalizeRelation(schema, tableNamesMap, relation);
            const relationTableName = getTableUniqueName(relation.referencedTable);
            const relationTableTsName = tableNamesMap[relationTableName];
            const relationTableAlias = `${tableAlias}_${selectedRelationTsKey}`;
            const joinOn2 = and(
              ...normalizedRelation.fields.map(
                (field2, i) => eq(
                  aliasedTableColumn(normalizedRelation.references[i], relationTableAlias),
                  aliasedTableColumn(field2, tableAlias)
                )
              )
            );
            const builtRelation = this.buildRelationalQuery({
              fullSchema,
              schema,
              tableNamesMap,
              table: fullSchema[relationTableTsName],
              tableConfig: schema[relationTableTsName],
              queryConfig: is(relation, One) ? selectedRelationConfigValue === true ? { limit: 1 } : { ...selectedRelationConfigValue, limit: 1 } : selectedRelationConfigValue,
              tableAlias: relationTableAlias,
              joinOn: joinOn2,
              nestedQueryRelation: relation
            });
            const field = sql`(${builtRelation.sql})`.as(selectedRelationTsKey);
            selection.push({
              dbKey: selectedRelationTsKey,
              tsKey: selectedRelationTsKey,
              field,
              relationTableTsKey: relationTableTsName,
              isJson: true,
              selection: builtRelation.selection
            });
          }
        }
        if (selection.length === 0) {
          throw new DrizzleError({
            message: `No fields selected for table "${tableConfig.tsName}" ("${tableAlias}"). You need to have at least one item in "columns", "with" or "extras". If you need to select all columns, omit the "columns" key or set it to undefined.`
          });
        }
        let result;
        where = and(joinOn, where);
        if (nestedQueryRelation) {
          let field = sql`json_array(${sql.join(
            selection.map(
              ({ field: field2 }) => is(field2, SQLiteColumn) ? sql.identifier(this.casing.getColumnCasing(field2)) : is(field2, SQL.Aliased) ? field2.sql : field2
            ),
            sql`, `
          )})`;
          if (is(nestedQueryRelation, Many)) {
            field = sql`coalesce(json_group_array(${field}), json_array())`;
          }
          const nestedSelection = [{
            dbKey: "data",
            tsKey: "data",
            field: field.as("data"),
            isJson: true,
            relationTableTsKey: tableConfig.tsName,
            selection
          }];
          const needsSubquery = limit !== void 0 || offset !== void 0 || orderBy.length > 0;
          if (needsSubquery) {
            result = this.buildSelectQuery({
              table: aliasedTable(table, tableAlias),
              fields: {},
              fieldsFlat: [
                {
                  path: [],
                  field: sql.raw("*")
                }
              ],
              where,
              limit,
              offset,
              orderBy,
              setOperators: []
            });
            where = void 0;
            limit = void 0;
            offset = void 0;
            orderBy = void 0;
          } else {
            result = aliasedTable(table, tableAlias);
          }
          result = this.buildSelectQuery({
            table: is(result, SQLiteTable) ? result : new Subquery(result, {}, tableAlias),
            fields: {},
            fieldsFlat: nestedSelection.map(({ field: field2 }) => ({
              path: [],
              field: is(field2, Column) ? aliasedTableColumn(field2, tableAlias) : field2
            })),
            joins,
            where,
            limit,
            offset,
            orderBy,
            setOperators: []
          });
        } else {
          result = this.buildSelectQuery({
            table: aliasedTable(table, tableAlias),
            fields: {},
            fieldsFlat: selection.map(({ field }) => ({
              path: [],
              field: is(field, Column) ? aliasedTableColumn(field, tableAlias) : field
            })),
            joins,
            where,
            limit,
            offset,
            orderBy,
            setOperators: []
          });
        }
        return {
          tableTsKey: tableConfig.tsName,
          sql: result,
          selection
        };
      }
    };
    SQLiteSyncDialect = class extends SQLiteDialect {
      static {
        __name(this, "SQLiteSyncDialect");
      }
      static [entityKind] = "SQLiteSyncDialect";
      migrate(migrations, session, config) {
        const migrationsTable = config === void 0 ? "__drizzle_migrations" : typeof config === "string" ? "__drizzle_migrations" : config.migrationsTable ?? "__drizzle_migrations";
        const migrationTableCreate = sql`
			CREATE TABLE IF NOT EXISTS ${sql.identifier(migrationsTable)} (
				id SERIAL PRIMARY KEY,
				hash text NOT NULL,
				created_at numeric
			)
		`;
        session.run(migrationTableCreate);
        const dbMigrations = session.values(
          sql`SELECT id, hash, created_at FROM ${sql.identifier(migrationsTable)} ORDER BY created_at DESC LIMIT 1`
        );
        const lastDbMigration = dbMigrations[0] ?? void 0;
        session.run(sql`BEGIN`);
        try {
          for (const migration of migrations) {
            if (!lastDbMigration || Number(lastDbMigration[2]) < migration.folderMillis) {
              for (const stmt of migration.sql) {
                session.run(sql.raw(stmt));
              }
              session.run(
                sql`INSERT INTO ${sql.identifier(migrationsTable)} ("hash", "created_at") VALUES(${migration.hash}, ${migration.folderMillis})`
              );
            }
          }
          session.run(sql`COMMIT`);
        } catch (e) {
          session.run(sql`ROLLBACK`);
          throw e;
        }
      }
    };
    SQLiteAsyncDialect = class extends SQLiteDialect {
      static {
        __name(this, "SQLiteAsyncDialect");
      }
      static [entityKind] = "SQLiteAsyncDialect";
      async migrate(migrations, session, config) {
        const migrationsTable = config === void 0 ? "__drizzle_migrations" : typeof config === "string" ? "__drizzle_migrations" : config.migrationsTable ?? "__drizzle_migrations";
        const migrationTableCreate = sql`
			CREATE TABLE IF NOT EXISTS ${sql.identifier(migrationsTable)} (
				id SERIAL PRIMARY KEY,
				hash text NOT NULL,
				created_at numeric
			)
		`;
        await session.run(migrationTableCreate);
        const dbMigrations = await session.values(
          sql`SELECT id, hash, created_at FROM ${sql.identifier(migrationsTable)} ORDER BY created_at DESC LIMIT 1`
        );
        const lastDbMigration = dbMigrations[0] ?? void 0;
        await session.transaction(async (tx) => {
          for (const migration of migrations) {
            if (!lastDbMigration || Number(lastDbMigration[2]) < migration.folderMillis) {
              for (const stmt of migration.sql) {
                await tx.run(sql.raw(stmt));
              }
              await tx.run(
                sql`INSERT INTO ${sql.identifier(migrationsTable)} ("hash", "created_at") VALUES(${migration.hash}, ${migration.folderMillis})`
              );
            }
          }
        });
      }
    };
  }
});

// ../node_modules/drizzle-orm/query-builders/query-builder.js
var TypedQueryBuilder;
var init_query_builder = __esm({
  "../node_modules/drizzle-orm/query-builders/query-builder.js"() {
    init_functionsRoutes_0_4727514041666032();
    init_entity();
    TypedQueryBuilder = class {
      static {
        __name(this, "TypedQueryBuilder");
      }
      static [entityKind] = "TypedQueryBuilder";
      /** @internal */
      getSelectedFields() {
        return this._.selectedFields;
      }
    };
  }
});

// ../node_modules/drizzle-orm/sqlite-core/query-builders/select.js
function createSetOperator(type, isAll) {
  return (leftSelect, rightSelect, ...restSelects) => {
    const setOperators = [rightSelect, ...restSelects].map((select) => ({
      type,
      isAll,
      rightSelect: select
    }));
    for (const setOperator of setOperators) {
      if (!haveSameKeys(leftSelect.getSelectedFields(), setOperator.rightSelect.getSelectedFields())) {
        throw new Error(
          "Set operator error (union / intersect / except): selected fields are not the same or are in a different order"
        );
      }
    }
    return leftSelect.addSetOperators(setOperators);
  };
}
var SQLiteSelectBuilder, SQLiteSelectQueryBuilderBase, SQLiteSelectBase, getSQLiteSetOperators, union, unionAll, intersect, except;
var init_select2 = __esm({
  "../node_modules/drizzle-orm/sqlite-core/query-builders/select.js"() {
    init_functionsRoutes_0_4727514041666032();
    init_entity();
    init_query_builder();
    init_query_promise();
    init_selection_proxy();
    init_sql();
    init_subquery();
    init_table();
    init_utils();
    init_view_common();
    init_utils2();
    init_view_base();
    SQLiteSelectBuilder = class {
      static {
        __name(this, "SQLiteSelectBuilder");
      }
      static [entityKind] = "SQLiteSelectBuilder";
      fields;
      session;
      dialect;
      withList;
      distinct;
      constructor(config) {
        this.fields = config.fields;
        this.session = config.session;
        this.dialect = config.dialect;
        this.withList = config.withList;
        this.distinct = config.distinct;
      }
      from(source) {
        const isPartialSelect = !!this.fields;
        let fields;
        if (this.fields) {
          fields = this.fields;
        } else if (is(source, Subquery)) {
          fields = Object.fromEntries(
            Object.keys(source._.selectedFields).map((key) => [key, source[key]])
          );
        } else if (is(source, SQLiteViewBase)) {
          fields = source[ViewBaseConfig].selectedFields;
        } else if (is(source, SQL)) {
          fields = {};
        } else {
          fields = getTableColumns(source);
        }
        return new SQLiteSelectBase({
          table: source,
          fields,
          isPartialSelect,
          session: this.session,
          dialect: this.dialect,
          withList: this.withList,
          distinct: this.distinct
        });
      }
    };
    SQLiteSelectQueryBuilderBase = class extends TypedQueryBuilder {
      static {
        __name(this, "SQLiteSelectQueryBuilderBase");
      }
      static [entityKind] = "SQLiteSelectQueryBuilder";
      _;
      /** @internal */
      config;
      joinsNotNullableMap;
      tableName;
      isPartialSelect;
      session;
      dialect;
      cacheConfig = void 0;
      usedTables = /* @__PURE__ */ new Set();
      constructor({ table, fields, isPartialSelect, session, dialect, withList, distinct }) {
        super();
        this.config = {
          withList,
          table,
          fields: { ...fields },
          distinct,
          setOperators: []
        };
        this.isPartialSelect = isPartialSelect;
        this.session = session;
        this.dialect = dialect;
        this._ = {
          selectedFields: fields,
          config: this.config
        };
        this.tableName = getTableLikeName(table);
        this.joinsNotNullableMap = typeof this.tableName === "string" ? { [this.tableName]: true } : {};
        for (const item of extractUsedTable(table)) this.usedTables.add(item);
      }
      /** @internal */
      getUsedTables() {
        return [...this.usedTables];
      }
      createJoin(joinType) {
        return (table, on) => {
          const baseTableName = this.tableName;
          const tableName = getTableLikeName(table);
          for (const item of extractUsedTable(table)) this.usedTables.add(item);
          if (typeof tableName === "string" && this.config.joins?.some((join) => join.alias === tableName)) {
            throw new Error(`Alias "${tableName}" is already used in this query`);
          }
          if (!this.isPartialSelect) {
            if (Object.keys(this.joinsNotNullableMap).length === 1 && typeof baseTableName === "string") {
              this.config.fields = {
                [baseTableName]: this.config.fields
              };
            }
            if (typeof tableName === "string" && !is(table, SQL)) {
              const selection = is(table, Subquery) ? table._.selectedFields : is(table, View) ? table[ViewBaseConfig].selectedFields : table[Table.Symbol.Columns];
              this.config.fields[tableName] = selection;
            }
          }
          if (typeof on === "function") {
            on = on(
              new Proxy(
                this.config.fields,
                new SelectionProxyHandler({ sqlAliasedBehavior: "sql", sqlBehavior: "sql" })
              )
            );
          }
          if (!this.config.joins) {
            this.config.joins = [];
          }
          this.config.joins.push({ on, table, joinType, alias: tableName });
          if (typeof tableName === "string") {
            switch (joinType) {
              case "left": {
                this.joinsNotNullableMap[tableName] = false;
                break;
              }
              case "right": {
                this.joinsNotNullableMap = Object.fromEntries(
                  Object.entries(this.joinsNotNullableMap).map(([key]) => [key, false])
                );
                this.joinsNotNullableMap[tableName] = true;
                break;
              }
              case "cross":
              case "inner": {
                this.joinsNotNullableMap[tableName] = true;
                break;
              }
              case "full": {
                this.joinsNotNullableMap = Object.fromEntries(
                  Object.entries(this.joinsNotNullableMap).map(([key]) => [key, false])
                );
                this.joinsNotNullableMap[tableName] = false;
                break;
              }
            }
          }
          return this;
        };
      }
      /**
       * Executes a `left join` operation by adding another table to the current query.
       *
       * Calling this method associates each row of the table with the corresponding row from the joined table, if a match is found. If no matching row exists, it sets all columns of the joined table to null.
       *
       * See docs: {@link https://orm.drizzle.team/docs/joins#left-join}
       *
       * @param table the table to join.
       * @param on the `on` clause.
       *
       * @example
       *
       * ```ts
       * // Select all users and their pets
       * const usersWithPets: { user: User; pets: Pet | null; }[] = await db.select()
       *   .from(users)
       *   .leftJoin(pets, eq(users.id, pets.ownerId))
       *
       * // Select userId and petId
       * const usersIdsAndPetIds: { userId: number; petId: number | null; }[] = await db.select({
       *   userId: users.id,
       *   petId: pets.id,
       * })
       *   .from(users)
       *   .leftJoin(pets, eq(users.id, pets.ownerId))
       * ```
       */
      leftJoin = this.createJoin("left");
      /**
       * Executes a `right join` operation by adding another table to the current query.
       *
       * Calling this method associates each row of the joined table with the corresponding row from the main table, if a match is found. If no matching row exists, it sets all columns of the main table to null.
       *
       * See docs: {@link https://orm.drizzle.team/docs/joins#right-join}
       *
       * @param table the table to join.
       * @param on the `on` clause.
       *
       * @example
       *
       * ```ts
       * // Select all users and their pets
       * const usersWithPets: { user: User | null; pets: Pet; }[] = await db.select()
       *   .from(users)
       *   .rightJoin(pets, eq(users.id, pets.ownerId))
       *
       * // Select userId and petId
       * const usersIdsAndPetIds: { userId: number | null; petId: number; }[] = await db.select({
       *   userId: users.id,
       *   petId: pets.id,
       * })
       *   .from(users)
       *   .rightJoin(pets, eq(users.id, pets.ownerId))
       * ```
       */
      rightJoin = this.createJoin("right");
      /**
       * Executes an `inner join` operation, creating a new table by combining rows from two tables that have matching values.
       *
       * Calling this method retrieves rows that have corresponding entries in both joined tables. Rows without matching entries in either table are excluded, resulting in a table that includes only matching pairs.
       *
       * See docs: {@link https://orm.drizzle.team/docs/joins#inner-join}
       *
       * @param table the table to join.
       * @param on the `on` clause.
       *
       * @example
       *
       * ```ts
       * // Select all users and their pets
       * const usersWithPets: { user: User; pets: Pet; }[] = await db.select()
       *   .from(users)
       *   .innerJoin(pets, eq(users.id, pets.ownerId))
       *
       * // Select userId and petId
       * const usersIdsAndPetIds: { userId: number; petId: number; }[] = await db.select({
       *   userId: users.id,
       *   petId: pets.id,
       * })
       *   .from(users)
       *   .innerJoin(pets, eq(users.id, pets.ownerId))
       * ```
       */
      innerJoin = this.createJoin("inner");
      /**
       * Executes a `full join` operation by combining rows from two tables into a new table.
       *
       * Calling this method retrieves all rows from both main and joined tables, merging rows with matching values and filling in `null` for non-matching columns.
       *
       * See docs: {@link https://orm.drizzle.team/docs/joins#full-join}
       *
       * @param table the table to join.
       * @param on the `on` clause.
       *
       * @example
       *
       * ```ts
       * // Select all users and their pets
       * const usersWithPets: { user: User | null; pets: Pet | null; }[] = await db.select()
       *   .from(users)
       *   .fullJoin(pets, eq(users.id, pets.ownerId))
       *
       * // Select userId and petId
       * const usersIdsAndPetIds: { userId: number | null; petId: number | null; }[] = await db.select({
       *   userId: users.id,
       *   petId: pets.id,
       * })
       *   .from(users)
       *   .fullJoin(pets, eq(users.id, pets.ownerId))
       * ```
       */
      fullJoin = this.createJoin("full");
      /**
       * Executes a `cross join` operation by combining rows from two tables into a new table.
       *
       * Calling this method retrieves all rows from both main and joined tables, merging all rows from each table.
       *
       * See docs: {@link https://orm.drizzle.team/docs/joins#cross-join}
       *
       * @param table the table to join.
       *
       * @example
       *
       * ```ts
       * // Select all users, each user with every pet
       * const usersWithPets: { user: User; pets: Pet; }[] = await db.select()
       *   .from(users)
       *   .crossJoin(pets)
       *
       * // Select userId and petId
       * const usersIdsAndPetIds: { userId: number; petId: number; }[] = await db.select({
       *   userId: users.id,
       *   petId: pets.id,
       * })
       *   .from(users)
       *   .crossJoin(pets)
       * ```
       */
      crossJoin = this.createJoin("cross");
      createSetOperator(type, isAll) {
        return (rightSelection) => {
          const rightSelect = typeof rightSelection === "function" ? rightSelection(getSQLiteSetOperators()) : rightSelection;
          if (!haveSameKeys(this.getSelectedFields(), rightSelect.getSelectedFields())) {
            throw new Error(
              "Set operator error (union / intersect / except): selected fields are not the same or are in a different order"
            );
          }
          this.config.setOperators.push({ type, isAll, rightSelect });
          return this;
        };
      }
      /**
       * Adds `union` set operator to the query.
       *
       * Calling this method will combine the result sets of the `select` statements and remove any duplicate rows that appear across them.
       *
       * See docs: {@link https://orm.drizzle.team/docs/set-operations#union}
       *
       * @example
       *
       * ```ts
       * // Select all unique names from customers and users tables
       * await db.select({ name: users.name })
       *   .from(users)
       *   .union(
       *     db.select({ name: customers.name }).from(customers)
       *   );
       * // or
       * import { union } from 'drizzle-orm/sqlite-core'
       *
       * await union(
       *   db.select({ name: users.name }).from(users),
       *   db.select({ name: customers.name }).from(customers)
       * );
       * ```
       */
      union = this.createSetOperator("union", false);
      /**
       * Adds `union all` set operator to the query.
       *
       * Calling this method will combine the result-set of the `select` statements and keep all duplicate rows that appear across them.
       *
       * See docs: {@link https://orm.drizzle.team/docs/set-operations#union-all}
       *
       * @example
       *
       * ```ts
       * // Select all transaction ids from both online and in-store sales
       * await db.select({ transaction: onlineSales.transactionId })
       *   .from(onlineSales)
       *   .unionAll(
       *     db.select({ transaction: inStoreSales.transactionId }).from(inStoreSales)
       *   );
       * // or
       * import { unionAll } from 'drizzle-orm/sqlite-core'
       *
       * await unionAll(
       *   db.select({ transaction: onlineSales.transactionId }).from(onlineSales),
       *   db.select({ transaction: inStoreSales.transactionId }).from(inStoreSales)
       * );
       * ```
       */
      unionAll = this.createSetOperator("union", true);
      /**
       * Adds `intersect` set operator to the query.
       *
       * Calling this method will retain only the rows that are present in both result sets and eliminate duplicates.
       *
       * See docs: {@link https://orm.drizzle.team/docs/set-operations#intersect}
       *
       * @example
       *
       * ```ts
       * // Select course names that are offered in both departments A and B
       * await db.select({ courseName: depA.courseName })
       *   .from(depA)
       *   .intersect(
       *     db.select({ courseName: depB.courseName }).from(depB)
       *   );
       * // or
       * import { intersect } from 'drizzle-orm/sqlite-core'
       *
       * await intersect(
       *   db.select({ courseName: depA.courseName }).from(depA),
       *   db.select({ courseName: depB.courseName }).from(depB)
       * );
       * ```
       */
      intersect = this.createSetOperator("intersect", false);
      /**
       * Adds `except` set operator to the query.
       *
       * Calling this method will retrieve all unique rows from the left query, except for the rows that are present in the result set of the right query.
       *
       * See docs: {@link https://orm.drizzle.team/docs/set-operations#except}
       *
       * @example
       *
       * ```ts
       * // Select all courses offered in department A but not in department B
       * await db.select({ courseName: depA.courseName })
       *   .from(depA)
       *   .except(
       *     db.select({ courseName: depB.courseName }).from(depB)
       *   );
       * // or
       * import { except } from 'drizzle-orm/sqlite-core'
       *
       * await except(
       *   db.select({ courseName: depA.courseName }).from(depA),
       *   db.select({ courseName: depB.courseName }).from(depB)
       * );
       * ```
       */
      except = this.createSetOperator("except", false);
      /** @internal */
      addSetOperators(setOperators) {
        this.config.setOperators.push(...setOperators);
        return this;
      }
      /**
       * Adds a `where` clause to the query.
       *
       * Calling this method will select only those rows that fulfill a specified condition.
       *
       * See docs: {@link https://orm.drizzle.team/docs/select#filtering}
       *
       * @param where the `where` clause.
       *
       * @example
       * You can use conditional operators and `sql function` to filter the rows to be selected.
       *
       * ```ts
       * // Select all cars with green color
       * await db.select().from(cars).where(eq(cars.color, 'green'));
       * // or
       * await db.select().from(cars).where(sql`${cars.color} = 'green'`)
       * ```
       *
       * You can logically combine conditional operators with `and()` and `or()` operators:
       *
       * ```ts
       * // Select all BMW cars with a green color
       * await db.select().from(cars).where(and(eq(cars.color, 'green'), eq(cars.brand, 'BMW')));
       *
       * // Select all cars with the green or blue color
       * await db.select().from(cars).where(or(eq(cars.color, 'green'), eq(cars.color, 'blue')));
       * ```
       */
      where(where) {
        if (typeof where === "function") {
          where = where(
            new Proxy(
              this.config.fields,
              new SelectionProxyHandler({ sqlAliasedBehavior: "sql", sqlBehavior: "sql" })
            )
          );
        }
        this.config.where = where;
        return this;
      }
      /**
       * Adds a `having` clause to the query.
       *
       * Calling this method will select only those rows that fulfill a specified condition. It is typically used with aggregate functions to filter the aggregated data based on a specified condition.
       *
       * See docs: {@link https://orm.drizzle.team/docs/select#aggregations}
       *
       * @param having the `having` clause.
       *
       * @example
       *
       * ```ts
       * // Select all brands with more than one car
       * await db.select({
       * 	brand: cars.brand,
       * 	count: sql<number>`cast(count(${cars.id}) as int)`,
       * })
       *   .from(cars)
       *   .groupBy(cars.brand)
       *   .having(({ count }) => gt(count, 1));
       * ```
       */
      having(having) {
        if (typeof having === "function") {
          having = having(
            new Proxy(
              this.config.fields,
              new SelectionProxyHandler({ sqlAliasedBehavior: "sql", sqlBehavior: "sql" })
            )
          );
        }
        this.config.having = having;
        return this;
      }
      groupBy(...columns) {
        if (typeof columns[0] === "function") {
          const groupBy = columns[0](
            new Proxy(
              this.config.fields,
              new SelectionProxyHandler({ sqlAliasedBehavior: "alias", sqlBehavior: "sql" })
            )
          );
          this.config.groupBy = Array.isArray(groupBy) ? groupBy : [groupBy];
        } else {
          this.config.groupBy = columns;
        }
        return this;
      }
      orderBy(...columns) {
        if (typeof columns[0] === "function") {
          const orderBy = columns[0](
            new Proxy(
              this.config.fields,
              new SelectionProxyHandler({ sqlAliasedBehavior: "alias", sqlBehavior: "sql" })
            )
          );
          const orderByArray = Array.isArray(orderBy) ? orderBy : [orderBy];
          if (this.config.setOperators.length > 0) {
            this.config.setOperators.at(-1).orderBy = orderByArray;
          } else {
            this.config.orderBy = orderByArray;
          }
        } else {
          const orderByArray = columns;
          if (this.config.setOperators.length > 0) {
            this.config.setOperators.at(-1).orderBy = orderByArray;
          } else {
            this.config.orderBy = orderByArray;
          }
        }
        return this;
      }
      /**
       * Adds a `limit` clause to the query.
       *
       * Calling this method will set the maximum number of rows that will be returned by this query.
       *
       * See docs: {@link https://orm.drizzle.team/docs/select#limit--offset}
       *
       * @param limit the `limit` clause.
       *
       * @example
       *
       * ```ts
       * // Get the first 10 people from this query.
       * await db.select().from(people).limit(10);
       * ```
       */
      limit(limit) {
        if (this.config.setOperators.length > 0) {
          this.config.setOperators.at(-1).limit = limit;
        } else {
          this.config.limit = limit;
        }
        return this;
      }
      /**
       * Adds an `offset` clause to the query.
       *
       * Calling this method will skip a number of rows when returning results from this query.
       *
       * See docs: {@link https://orm.drizzle.team/docs/select#limit--offset}
       *
       * @param offset the `offset` clause.
       *
       * @example
       *
       * ```ts
       * // Get the 10th-20th people from this query.
       * await db.select().from(people).offset(10).limit(10);
       * ```
       */
      offset(offset) {
        if (this.config.setOperators.length > 0) {
          this.config.setOperators.at(-1).offset = offset;
        } else {
          this.config.offset = offset;
        }
        return this;
      }
      /** @internal */
      getSQL() {
        return this.dialect.buildSelectQuery(this.config);
      }
      toSQL() {
        const { typings: _typings, ...rest } = this.dialect.sqlToQuery(this.getSQL());
        return rest;
      }
      as(alias) {
        const usedTables = [];
        usedTables.push(...extractUsedTable(this.config.table));
        if (this.config.joins) {
          for (const it of this.config.joins) usedTables.push(...extractUsedTable(it.table));
        }
        return new Proxy(
          new Subquery(this.getSQL(), this.config.fields, alias, false, [...new Set(usedTables)]),
          new SelectionProxyHandler({ alias, sqlAliasedBehavior: "alias", sqlBehavior: "error" })
        );
      }
      /** @internal */
      getSelectedFields() {
        return new Proxy(
          this.config.fields,
          new SelectionProxyHandler({ alias: this.tableName, sqlAliasedBehavior: "alias", sqlBehavior: "error" })
        );
      }
      $dynamic() {
        return this;
      }
    };
    SQLiteSelectBase = class extends SQLiteSelectQueryBuilderBase {
      static {
        __name(this, "SQLiteSelectBase");
      }
      static [entityKind] = "SQLiteSelect";
      /** @internal */
      _prepare(isOneTimeQuery = true) {
        if (!this.session) {
          throw new Error("Cannot execute a query on a query builder. Please use a database instance instead.");
        }
        const fieldsList = orderSelectedFields(this.config.fields);
        const query = this.session[isOneTimeQuery ? "prepareOneTimeQuery" : "prepareQuery"](
          this.dialect.sqlToQuery(this.getSQL()),
          fieldsList,
          "all",
          true,
          void 0,
          {
            type: "select",
            tables: [...this.usedTables]
          },
          this.cacheConfig
        );
        query.joinsNotNullableMap = this.joinsNotNullableMap;
        return query;
      }
      $withCache(config) {
        this.cacheConfig = config === void 0 ? { config: {}, enable: true, autoInvalidate: true } : config === false ? { enable: false } : { enable: true, autoInvalidate: true, ...config };
        return this;
      }
      prepare() {
        return this._prepare(false);
      }
      run = /* @__PURE__ */ __name((placeholderValues) => {
        return this._prepare().run(placeholderValues);
      }, "run");
      all = /* @__PURE__ */ __name((placeholderValues) => {
        return this._prepare().all(placeholderValues);
      }, "all");
      get = /* @__PURE__ */ __name((placeholderValues) => {
        return this._prepare().get(placeholderValues);
      }, "get");
      values = /* @__PURE__ */ __name((placeholderValues) => {
        return this._prepare().values(placeholderValues);
      }, "values");
      async execute() {
        return this.all();
      }
    };
    applyMixins(SQLiteSelectBase, [QueryPromise]);
    __name(createSetOperator, "createSetOperator");
    getSQLiteSetOperators = /* @__PURE__ */ __name(() => ({
      union,
      unionAll,
      intersect,
      except
    }), "getSQLiteSetOperators");
    union = createSetOperator("union", false);
    unionAll = createSetOperator("union", true);
    intersect = createSetOperator("intersect", false);
    except = createSetOperator("except", false);
  }
});

// ../node_modules/drizzle-orm/sqlite-core/query-builders/query-builder.js
var QueryBuilder;
var init_query_builder2 = __esm({
  "../node_modules/drizzle-orm/sqlite-core/query-builders/query-builder.js"() {
    init_functionsRoutes_0_4727514041666032();
    init_entity();
    init_selection_proxy();
    init_dialect();
    init_subquery();
    init_select2();
    QueryBuilder = class {
      static {
        __name(this, "QueryBuilder");
      }
      static [entityKind] = "SQLiteQueryBuilder";
      dialect;
      dialectConfig;
      constructor(dialect) {
        this.dialect = is(dialect, SQLiteDialect) ? dialect : void 0;
        this.dialectConfig = is(dialect, SQLiteDialect) ? void 0 : dialect;
      }
      $with = /* @__PURE__ */ __name((alias, selection) => {
        const queryBuilder = this;
        const as = /* @__PURE__ */ __name((qb) => {
          if (typeof qb === "function") {
            qb = qb(queryBuilder);
          }
          return new Proxy(
            new WithSubquery(
              qb.getSQL(),
              selection ?? ("getSelectedFields" in qb ? qb.getSelectedFields() ?? {} : {}),
              alias,
              true
            ),
            new SelectionProxyHandler({ alias, sqlAliasedBehavior: "alias", sqlBehavior: "error" })
          );
        }, "as");
        return { as };
      }, "$with");
      with(...queries) {
        const self = this;
        function select(fields) {
          return new SQLiteSelectBuilder({
            fields: fields ?? void 0,
            session: void 0,
            dialect: self.getDialect(),
            withList: queries
          });
        }
        __name(select, "select");
        function selectDistinct(fields) {
          return new SQLiteSelectBuilder({
            fields: fields ?? void 0,
            session: void 0,
            dialect: self.getDialect(),
            withList: queries,
            distinct: true
          });
        }
        __name(selectDistinct, "selectDistinct");
        return { select, selectDistinct };
      }
      select(fields) {
        return new SQLiteSelectBuilder({ fields: fields ?? void 0, session: void 0, dialect: this.getDialect() });
      }
      selectDistinct(fields) {
        return new SQLiteSelectBuilder({
          fields: fields ?? void 0,
          session: void 0,
          dialect: this.getDialect(),
          distinct: true
        });
      }
      // Lazy load dialect to avoid circular dependency
      getDialect() {
        if (!this.dialect) {
          this.dialect = new SQLiteSyncDialect(this.dialectConfig);
        }
        return this.dialect;
      }
    };
  }
});

// ../node_modules/drizzle-orm/sqlite-core/query-builders/insert.js
var SQLiteInsertBuilder, SQLiteInsertBase;
var init_insert = __esm({
  "../node_modules/drizzle-orm/sqlite-core/query-builders/insert.js"() {
    init_functionsRoutes_0_4727514041666032();
    init_entity();
    init_query_promise();
    init_sql();
    init_table3();
    init_table();
    init_utils();
    init_utils2();
    init_query_builder2();
    SQLiteInsertBuilder = class {
      static {
        __name(this, "SQLiteInsertBuilder");
      }
      constructor(table, session, dialect, withList) {
        this.table = table;
        this.session = session;
        this.dialect = dialect;
        this.withList = withList;
      }
      static [entityKind] = "SQLiteInsertBuilder";
      values(values) {
        values = Array.isArray(values) ? values : [values];
        if (values.length === 0) {
          throw new Error("values() must be called with at least one value");
        }
        const mappedValues = values.map((entry) => {
          const result = {};
          const cols = this.table[Table.Symbol.Columns];
          for (const colKey of Object.keys(entry)) {
            const colValue = entry[colKey];
            result[colKey] = is(colValue, SQL) ? colValue : new Param(colValue, cols[colKey]);
          }
          return result;
        });
        return new SQLiteInsertBase(this.table, mappedValues, this.session, this.dialect, this.withList);
      }
      select(selectQuery) {
        const select = typeof selectQuery === "function" ? selectQuery(new QueryBuilder()) : selectQuery;
        if (!is(select, SQL) && !haveSameKeys(this.table[Columns], select._.selectedFields)) {
          throw new Error(
            "Insert select error: selected fields are not the same or are in a different order compared to the table definition"
          );
        }
        return new SQLiteInsertBase(this.table, select, this.session, this.dialect, this.withList, true);
      }
    };
    SQLiteInsertBase = class extends QueryPromise {
      static {
        __name(this, "SQLiteInsertBase");
      }
      constructor(table, values, session, dialect, withList, select) {
        super();
        this.session = session;
        this.dialect = dialect;
        this.config = { table, values, withList, select };
      }
      static [entityKind] = "SQLiteInsert";
      /** @internal */
      config;
      returning(fields = this.config.table[SQLiteTable.Symbol.Columns]) {
        this.config.returning = orderSelectedFields(fields);
        return this;
      }
      /**
       * Adds an `on conflict do nothing` clause to the query.
       *
       * Calling this method simply avoids inserting a row as its alternative action.
       *
       * See docs: {@link https://orm.drizzle.team/docs/insert#on-conflict-do-nothing}
       *
       * @param config The `target` and `where` clauses.
       *
       * @example
       * ```ts
       * // Insert one row and cancel the insert if there's a conflict
       * await db.insert(cars)
       *   .values({ id: 1, brand: 'BMW' })
       *   .onConflictDoNothing();
       *
       * // Explicitly specify conflict target
       * await db.insert(cars)
       *   .values({ id: 1, brand: 'BMW' })
       *   .onConflictDoNothing({ target: cars.id });
       * ```
       */
      onConflictDoNothing(config = {}) {
        if (!this.config.onConflict) this.config.onConflict = [];
        if (config.target === void 0) {
          this.config.onConflict.push(sql` on conflict do nothing`);
        } else {
          const targetSql = Array.isArray(config.target) ? sql`${config.target}` : sql`${[config.target]}`;
          const whereSql = config.where ? sql` where ${config.where}` : sql``;
          this.config.onConflict.push(sql` on conflict ${targetSql} do nothing${whereSql}`);
        }
        return this;
      }
      /**
       * Adds an `on conflict do update` clause to the query.
       *
       * Calling this method will update the existing row that conflicts with the row proposed for insertion as its alternative action.
       *
       * See docs: {@link https://orm.drizzle.team/docs/insert#upserts-and-conflicts}
       *
       * @param config The `target`, `set` and `where` clauses.
       *
       * @example
       * ```ts
       * // Update the row if there's a conflict
       * await db.insert(cars)
       *   .values({ id: 1, brand: 'BMW' })
       *   .onConflictDoUpdate({
       *     target: cars.id,
       *     set: { brand: 'Porsche' }
       *   });
       *
       * // Upsert with 'where' clause
       * await db.insert(cars)
       *   .values({ id: 1, brand: 'BMW' })
       *   .onConflictDoUpdate({
       *     target: cars.id,
       *     set: { brand: 'newBMW' },
       *     where: sql`${cars.createdAt} > '2023-01-01'::date`,
       *   });
       * ```
       */
      onConflictDoUpdate(config) {
        if (config.where && (config.targetWhere || config.setWhere)) {
          throw new Error(
            'You cannot use both "where" and "targetWhere"/"setWhere" at the same time - "where" is deprecated, use "targetWhere" or "setWhere" instead.'
          );
        }
        if (!this.config.onConflict) this.config.onConflict = [];
        const whereSql = config.where ? sql` where ${config.where}` : void 0;
        const targetWhereSql = config.targetWhere ? sql` where ${config.targetWhere}` : void 0;
        const setWhereSql = config.setWhere ? sql` where ${config.setWhere}` : void 0;
        const targetSql = Array.isArray(config.target) ? sql`${config.target}` : sql`${[config.target]}`;
        const setSql = this.dialect.buildUpdateSet(this.config.table, mapUpdateSet(this.config.table, config.set));
        this.config.onConflict.push(
          sql` on conflict ${targetSql}${targetWhereSql} do update set ${setSql}${whereSql}${setWhereSql}`
        );
        return this;
      }
      /** @internal */
      getSQL() {
        return this.dialect.buildInsertQuery(this.config);
      }
      toSQL() {
        const { typings: _typings, ...rest } = this.dialect.sqlToQuery(this.getSQL());
        return rest;
      }
      /** @internal */
      _prepare(isOneTimeQuery = true) {
        return this.session[isOneTimeQuery ? "prepareOneTimeQuery" : "prepareQuery"](
          this.dialect.sqlToQuery(this.getSQL()),
          this.config.returning,
          this.config.returning ? "all" : "run",
          true,
          void 0,
          {
            type: "insert",
            tables: extractUsedTable(this.config.table)
          }
        );
      }
      prepare() {
        return this._prepare(false);
      }
      run = /* @__PURE__ */ __name((placeholderValues) => {
        return this._prepare().run(placeholderValues);
      }, "run");
      all = /* @__PURE__ */ __name((placeholderValues) => {
        return this._prepare().all(placeholderValues);
      }, "all");
      get = /* @__PURE__ */ __name((placeholderValues) => {
        return this._prepare().get(placeholderValues);
      }, "get");
      values = /* @__PURE__ */ __name((placeholderValues) => {
        return this._prepare().values(placeholderValues);
      }, "values");
      async execute() {
        return this.config.returning ? this.all() : this.run();
      }
      $dynamic() {
        return this;
      }
    };
  }
});

// ../node_modules/drizzle-orm/sqlite-core/query-builders/select.types.js
var init_select_types = __esm({
  "../node_modules/drizzle-orm/sqlite-core/query-builders/select.types.js"() {
    init_functionsRoutes_0_4727514041666032();
  }
});

// ../node_modules/drizzle-orm/sqlite-core/query-builders/update.js
var SQLiteUpdateBuilder, SQLiteUpdateBase;
var init_update = __esm({
  "../node_modules/drizzle-orm/sqlite-core/query-builders/update.js"() {
    init_functionsRoutes_0_4727514041666032();
    init_entity();
    init_query_promise();
    init_selection_proxy();
    init_table3();
    init_subquery();
    init_table();
    init_utils();
    init_view_common();
    init_utils2();
    init_view_base();
    SQLiteUpdateBuilder = class {
      static {
        __name(this, "SQLiteUpdateBuilder");
      }
      constructor(table, session, dialect, withList) {
        this.table = table;
        this.session = session;
        this.dialect = dialect;
        this.withList = withList;
      }
      static [entityKind] = "SQLiteUpdateBuilder";
      set(values) {
        return new SQLiteUpdateBase(
          this.table,
          mapUpdateSet(this.table, values),
          this.session,
          this.dialect,
          this.withList
        );
      }
    };
    SQLiteUpdateBase = class extends QueryPromise {
      static {
        __name(this, "SQLiteUpdateBase");
      }
      constructor(table, set, session, dialect, withList) {
        super();
        this.session = session;
        this.dialect = dialect;
        this.config = { set, table, withList, joins: [] };
      }
      static [entityKind] = "SQLiteUpdate";
      /** @internal */
      config;
      from(source) {
        this.config.from = source;
        return this;
      }
      createJoin(joinType) {
        return (table, on) => {
          const tableName = getTableLikeName(table);
          if (typeof tableName === "string" && this.config.joins.some((join) => join.alias === tableName)) {
            throw new Error(`Alias "${tableName}" is already used in this query`);
          }
          if (typeof on === "function") {
            const from = this.config.from ? is(table, SQLiteTable) ? table[Table.Symbol.Columns] : is(table, Subquery) ? table._.selectedFields : is(table, SQLiteViewBase) ? table[ViewBaseConfig].selectedFields : void 0 : void 0;
            on = on(
              new Proxy(
                this.config.table[Table.Symbol.Columns],
                new SelectionProxyHandler({ sqlAliasedBehavior: "sql", sqlBehavior: "sql" })
              ),
              from && new Proxy(
                from,
                new SelectionProxyHandler({ sqlAliasedBehavior: "sql", sqlBehavior: "sql" })
              )
            );
          }
          this.config.joins.push({ on, table, joinType, alias: tableName });
          return this;
        };
      }
      leftJoin = this.createJoin("left");
      rightJoin = this.createJoin("right");
      innerJoin = this.createJoin("inner");
      fullJoin = this.createJoin("full");
      /**
       * Adds a 'where' clause to the query.
       *
       * Calling this method will update only those rows that fulfill a specified condition.
       *
       * See docs: {@link https://orm.drizzle.team/docs/update}
       *
       * @param where the 'where' clause.
       *
       * @example
       * You can use conditional operators and `sql function` to filter the rows to be updated.
       *
       * ```ts
       * // Update all cars with green color
       * db.update(cars).set({ color: 'red' })
       *   .where(eq(cars.color, 'green'));
       * // or
       * db.update(cars).set({ color: 'red' })
       *   .where(sql`${cars.color} = 'green'`)
       * ```
       *
       * You can logically combine conditional operators with `and()` and `or()` operators:
       *
       * ```ts
       * // Update all BMW cars with a green color
       * db.update(cars).set({ color: 'red' })
       *   .where(and(eq(cars.color, 'green'), eq(cars.brand, 'BMW')));
       *
       * // Update all cars with the green or blue color
       * db.update(cars).set({ color: 'red' })
       *   .where(or(eq(cars.color, 'green'), eq(cars.color, 'blue')));
       * ```
       */
      where(where) {
        this.config.where = where;
        return this;
      }
      orderBy(...columns) {
        if (typeof columns[0] === "function") {
          const orderBy = columns[0](
            new Proxy(
              this.config.table[Table.Symbol.Columns],
              new SelectionProxyHandler({ sqlAliasedBehavior: "alias", sqlBehavior: "sql" })
            )
          );
          const orderByArray = Array.isArray(orderBy) ? orderBy : [orderBy];
          this.config.orderBy = orderByArray;
        } else {
          const orderByArray = columns;
          this.config.orderBy = orderByArray;
        }
        return this;
      }
      limit(limit) {
        this.config.limit = limit;
        return this;
      }
      returning(fields = this.config.table[SQLiteTable.Symbol.Columns]) {
        this.config.returning = orderSelectedFields(fields);
        return this;
      }
      /** @internal */
      getSQL() {
        return this.dialect.buildUpdateQuery(this.config);
      }
      toSQL() {
        const { typings: _typings, ...rest } = this.dialect.sqlToQuery(this.getSQL());
        return rest;
      }
      /** @internal */
      _prepare(isOneTimeQuery = true) {
        return this.session[isOneTimeQuery ? "prepareOneTimeQuery" : "prepareQuery"](
          this.dialect.sqlToQuery(this.getSQL()),
          this.config.returning,
          this.config.returning ? "all" : "run",
          true,
          void 0,
          {
            type: "insert",
            tables: extractUsedTable(this.config.table)
          }
        );
      }
      prepare() {
        return this._prepare(false);
      }
      run = /* @__PURE__ */ __name((placeholderValues) => {
        return this._prepare().run(placeholderValues);
      }, "run");
      all = /* @__PURE__ */ __name((placeholderValues) => {
        return this._prepare().all(placeholderValues);
      }, "all");
      get = /* @__PURE__ */ __name((placeholderValues) => {
        return this._prepare().get(placeholderValues);
      }, "get");
      values = /* @__PURE__ */ __name((placeholderValues) => {
        return this._prepare().values(placeholderValues);
      }, "values");
      async execute() {
        return this.config.returning ? this.all() : this.run();
      }
      $dynamic() {
        return this;
      }
    };
  }
});

// ../node_modules/drizzle-orm/sqlite-core/query-builders/index.js
var init_query_builders = __esm({
  "../node_modules/drizzle-orm/sqlite-core/query-builders/index.js"() {
    init_functionsRoutes_0_4727514041666032();
    init_delete();
    init_insert();
    init_query_builder2();
    init_select2();
    init_select_types();
    init_update();
  }
});

// ../node_modules/drizzle-orm/sqlite-core/query-builders/count.js
var SQLiteCountBuilder;
var init_count = __esm({
  "../node_modules/drizzle-orm/sqlite-core/query-builders/count.js"() {
    init_functionsRoutes_0_4727514041666032();
    init_entity();
    init_sql();
    SQLiteCountBuilder = class _SQLiteCountBuilder extends SQL {
      static {
        __name(this, "SQLiteCountBuilder");
      }
      constructor(params) {
        super(_SQLiteCountBuilder.buildEmbeddedCount(params.source, params.filters).queryChunks);
        this.params = params;
        this.session = params.session;
        this.sql = _SQLiteCountBuilder.buildCount(
          params.source,
          params.filters
        );
      }
      sql;
      static [entityKind] = "SQLiteCountBuilderAsync";
      [Symbol.toStringTag] = "SQLiteCountBuilderAsync";
      session;
      static buildEmbeddedCount(source, filters) {
        return sql`(select count(*) from ${source}${sql.raw(" where ").if(filters)}${filters})`;
      }
      static buildCount(source, filters) {
        return sql`select count(*) from ${source}${sql.raw(" where ").if(filters)}${filters}`;
      }
      then(onfulfilled, onrejected) {
        return Promise.resolve(this.session.count(this.sql)).then(
          onfulfilled,
          onrejected
        );
      }
      catch(onRejected) {
        return this.then(void 0, onRejected);
      }
      finally(onFinally) {
        return this.then(
          (value) => {
            onFinally?.();
            return value;
          },
          (reason) => {
            onFinally?.();
            throw reason;
          }
        );
      }
    };
  }
});

// ../node_modules/drizzle-orm/sqlite-core/query-builders/query.js
var RelationalQueryBuilder, SQLiteRelationalQuery, SQLiteSyncRelationalQuery;
var init_query = __esm({
  "../node_modules/drizzle-orm/sqlite-core/query-builders/query.js"() {
    init_functionsRoutes_0_4727514041666032();
    init_entity();
    init_query_promise();
    init_relations();
    RelationalQueryBuilder = class {
      static {
        __name(this, "RelationalQueryBuilder");
      }
      constructor(mode, fullSchema, schema, tableNamesMap, table, tableConfig, dialect, session) {
        this.mode = mode;
        this.fullSchema = fullSchema;
        this.schema = schema;
        this.tableNamesMap = tableNamesMap;
        this.table = table;
        this.tableConfig = tableConfig;
        this.dialect = dialect;
        this.session = session;
      }
      static [entityKind] = "SQLiteAsyncRelationalQueryBuilder";
      findMany(config) {
        return this.mode === "sync" ? new SQLiteSyncRelationalQuery(
          this.fullSchema,
          this.schema,
          this.tableNamesMap,
          this.table,
          this.tableConfig,
          this.dialect,
          this.session,
          config ? config : {},
          "many"
        ) : new SQLiteRelationalQuery(
          this.fullSchema,
          this.schema,
          this.tableNamesMap,
          this.table,
          this.tableConfig,
          this.dialect,
          this.session,
          config ? config : {},
          "many"
        );
      }
      findFirst(config) {
        return this.mode === "sync" ? new SQLiteSyncRelationalQuery(
          this.fullSchema,
          this.schema,
          this.tableNamesMap,
          this.table,
          this.tableConfig,
          this.dialect,
          this.session,
          config ? { ...config, limit: 1 } : { limit: 1 },
          "first"
        ) : new SQLiteRelationalQuery(
          this.fullSchema,
          this.schema,
          this.tableNamesMap,
          this.table,
          this.tableConfig,
          this.dialect,
          this.session,
          config ? { ...config, limit: 1 } : { limit: 1 },
          "first"
        );
      }
    };
    SQLiteRelationalQuery = class extends QueryPromise {
      static {
        __name(this, "SQLiteRelationalQuery");
      }
      constructor(fullSchema, schema, tableNamesMap, table, tableConfig, dialect, session, config, mode) {
        super();
        this.fullSchema = fullSchema;
        this.schema = schema;
        this.tableNamesMap = tableNamesMap;
        this.table = table;
        this.tableConfig = tableConfig;
        this.dialect = dialect;
        this.session = session;
        this.config = config;
        this.mode = mode;
      }
      static [entityKind] = "SQLiteAsyncRelationalQuery";
      /** @internal */
      mode;
      /** @internal */
      getSQL() {
        return this.dialect.buildRelationalQuery({
          fullSchema: this.fullSchema,
          schema: this.schema,
          tableNamesMap: this.tableNamesMap,
          table: this.table,
          tableConfig: this.tableConfig,
          queryConfig: this.config,
          tableAlias: this.tableConfig.tsName
        }).sql;
      }
      /** @internal */
      _prepare(isOneTimeQuery = false) {
        const { query, builtQuery } = this._toSQL();
        return this.session[isOneTimeQuery ? "prepareOneTimeQuery" : "prepareQuery"](
          builtQuery,
          void 0,
          this.mode === "first" ? "get" : "all",
          true,
          (rawRows, mapColumnValue) => {
            const rows = rawRows.map(
              (row) => mapRelationalRow(this.schema, this.tableConfig, row, query.selection, mapColumnValue)
            );
            if (this.mode === "first") {
              return rows[0];
            }
            return rows;
          }
        );
      }
      prepare() {
        return this._prepare(false);
      }
      _toSQL() {
        const query = this.dialect.buildRelationalQuery({
          fullSchema: this.fullSchema,
          schema: this.schema,
          tableNamesMap: this.tableNamesMap,
          table: this.table,
          tableConfig: this.tableConfig,
          queryConfig: this.config,
          tableAlias: this.tableConfig.tsName
        });
        const builtQuery = this.dialect.sqlToQuery(query.sql);
        return { query, builtQuery };
      }
      toSQL() {
        return this._toSQL().builtQuery;
      }
      /** @internal */
      executeRaw() {
        if (this.mode === "first") {
          return this._prepare(false).get();
        }
        return this._prepare(false).all();
      }
      async execute() {
        return this.executeRaw();
      }
    };
    SQLiteSyncRelationalQuery = class extends SQLiteRelationalQuery {
      static {
        __name(this, "SQLiteSyncRelationalQuery");
      }
      static [entityKind] = "SQLiteSyncRelationalQuery";
      sync() {
        return this.executeRaw();
      }
    };
  }
});

// ../node_modules/drizzle-orm/sqlite-core/query-builders/raw.js
var SQLiteRaw;
var init_raw = __esm({
  "../node_modules/drizzle-orm/sqlite-core/query-builders/raw.js"() {
    init_functionsRoutes_0_4727514041666032();
    init_entity();
    init_query_promise();
    SQLiteRaw = class extends QueryPromise {
      static {
        __name(this, "SQLiteRaw");
      }
      constructor(execute, getSQL, action, dialect, mapBatchResult) {
        super();
        this.execute = execute;
        this.getSQL = getSQL;
        this.dialect = dialect;
        this.mapBatchResult = mapBatchResult;
        this.config = { action };
      }
      static [entityKind] = "SQLiteRaw";
      /** @internal */
      config;
      getQuery() {
        return { ...this.dialect.sqlToQuery(this.getSQL()), method: this.config.action };
      }
      mapResult(result, isFromBatch) {
        return isFromBatch ? this.mapBatchResult(result) : result;
      }
      _prepare() {
        return this;
      }
      /** @internal */
      isResponseInArrayMode() {
        return false;
      }
    };
  }
});

// ../node_modules/drizzle-orm/sqlite-core/db.js
var BaseSQLiteDatabase;
var init_db = __esm({
  "../node_modules/drizzle-orm/sqlite-core/db.js"() {
    init_functionsRoutes_0_4727514041666032();
    init_entity();
    init_selection_proxy();
    init_sql();
    init_query_builders();
    init_subquery();
    init_count();
    init_query();
    init_raw();
    BaseSQLiteDatabase = class {
      static {
        __name(this, "BaseSQLiteDatabase");
      }
      constructor(resultKind, dialect, session, schema) {
        this.resultKind = resultKind;
        this.dialect = dialect;
        this.session = session;
        this._ = schema ? {
          schema: schema.schema,
          fullSchema: schema.fullSchema,
          tableNamesMap: schema.tableNamesMap
        } : {
          schema: void 0,
          fullSchema: {},
          tableNamesMap: {}
        };
        this.query = {};
        const query = this.query;
        if (this._.schema) {
          for (const [tableName, columns] of Object.entries(this._.schema)) {
            query[tableName] = new RelationalQueryBuilder(
              resultKind,
              schema.fullSchema,
              this._.schema,
              this._.tableNamesMap,
              schema.fullSchema[tableName],
              columns,
              dialect,
              session
            );
          }
        }
        this.$cache = { invalidate: /* @__PURE__ */ __name(async (_params) => {
        }, "invalidate") };
      }
      static [entityKind] = "BaseSQLiteDatabase";
      query;
      /**
       * Creates a subquery that defines a temporary named result set as a CTE.
       *
       * It is useful for breaking down complex queries into simpler parts and for reusing the result set in subsequent parts of the query.
       *
       * See docs: {@link https://orm.drizzle.team/docs/select#with-clause}
       *
       * @param alias The alias for the subquery.
       *
       * Failure to provide an alias will result in a DrizzleTypeError, preventing the subquery from being referenced in other queries.
       *
       * @example
       *
       * ```ts
       * // Create a subquery with alias 'sq' and use it in the select query
       * const sq = db.$with('sq').as(db.select().from(users).where(eq(users.id, 42)));
       *
       * const result = await db.with(sq).select().from(sq);
       * ```
       *
       * To select arbitrary SQL values as fields in a CTE and reference them in other CTEs or in the main query, you need to add aliases to them:
       *
       * ```ts
       * // Select an arbitrary SQL value as a field in a CTE and reference it in the main query
       * const sq = db.$with('sq').as(db.select({
       *   name: sql<string>`upper(${users.name})`.as('name'),
       * })
       * .from(users));
       *
       * const result = await db.with(sq).select({ name: sq.name }).from(sq);
       * ```
       */
      $with = /* @__PURE__ */ __name((alias, selection) => {
        const self = this;
        const as = /* @__PURE__ */ __name((qb) => {
          if (typeof qb === "function") {
            qb = qb(new QueryBuilder(self.dialect));
          }
          return new Proxy(
            new WithSubquery(
              qb.getSQL(),
              selection ?? ("getSelectedFields" in qb ? qb.getSelectedFields() ?? {} : {}),
              alias,
              true
            ),
            new SelectionProxyHandler({ alias, sqlAliasedBehavior: "alias", sqlBehavior: "error" })
          );
        }, "as");
        return { as };
      }, "$with");
      $count(source, filters) {
        return new SQLiteCountBuilder({ source, filters, session: this.session });
      }
      /**
       * Incorporates a previously defined CTE (using `$with`) into the main query.
       *
       * This method allows the main query to reference a temporary named result set.
       *
       * See docs: {@link https://orm.drizzle.team/docs/select#with-clause}
       *
       * @param queries The CTEs to incorporate into the main query.
       *
       * @example
       *
       * ```ts
       * // Define a subquery 'sq' as a CTE using $with
       * const sq = db.$with('sq').as(db.select().from(users).where(eq(users.id, 42)));
       *
       * // Incorporate the CTE 'sq' into the main query and select from it
       * const result = await db.with(sq).select().from(sq);
       * ```
       */
      with(...queries) {
        const self = this;
        function select(fields) {
          return new SQLiteSelectBuilder({
            fields: fields ?? void 0,
            session: self.session,
            dialect: self.dialect,
            withList: queries
          });
        }
        __name(select, "select");
        function selectDistinct(fields) {
          return new SQLiteSelectBuilder({
            fields: fields ?? void 0,
            session: self.session,
            dialect: self.dialect,
            withList: queries,
            distinct: true
          });
        }
        __name(selectDistinct, "selectDistinct");
        function update(table) {
          return new SQLiteUpdateBuilder(table, self.session, self.dialect, queries);
        }
        __name(update, "update");
        function insert(into) {
          return new SQLiteInsertBuilder(into, self.session, self.dialect, queries);
        }
        __name(insert, "insert");
        function delete_(from) {
          return new SQLiteDeleteBase(from, self.session, self.dialect, queries);
        }
        __name(delete_, "delete_");
        return { select, selectDistinct, update, insert, delete: delete_ };
      }
      select(fields) {
        return new SQLiteSelectBuilder({ fields: fields ?? void 0, session: this.session, dialect: this.dialect });
      }
      selectDistinct(fields) {
        return new SQLiteSelectBuilder({
          fields: fields ?? void 0,
          session: this.session,
          dialect: this.dialect,
          distinct: true
        });
      }
      /**
       * Creates an update query.
       *
       * Calling this method without `.where()` clause will update all rows in a table. The `.where()` clause specifies which rows should be updated.
       *
       * Use `.set()` method to specify which values to update.
       *
       * See docs: {@link https://orm.drizzle.team/docs/update}
       *
       * @param table The table to update.
       *
       * @example
       *
       * ```ts
       * // Update all rows in the 'cars' table
       * await db.update(cars).set({ color: 'red' });
       *
       * // Update rows with filters and conditions
       * await db.update(cars).set({ color: 'red' }).where(eq(cars.brand, 'BMW'));
       *
       * // Update with returning clause
       * const updatedCar: Car[] = await db.update(cars)
       *   .set({ color: 'red' })
       *   .where(eq(cars.id, 1))
       *   .returning();
       * ```
       */
      update(table) {
        return new SQLiteUpdateBuilder(table, this.session, this.dialect);
      }
      $cache;
      /**
       * Creates an insert query.
       *
       * Calling this method will create new rows in a table. Use `.values()` method to specify which values to insert.
       *
       * See docs: {@link https://orm.drizzle.team/docs/insert}
       *
       * @param table The table to insert into.
       *
       * @example
       *
       * ```ts
       * // Insert one row
       * await db.insert(cars).values({ brand: 'BMW' });
       *
       * // Insert multiple rows
       * await db.insert(cars).values([{ brand: 'BMW' }, { brand: 'Porsche' }]);
       *
       * // Insert with returning clause
       * const insertedCar: Car[] = await db.insert(cars)
       *   .values({ brand: 'BMW' })
       *   .returning();
       * ```
       */
      insert(into) {
        return new SQLiteInsertBuilder(into, this.session, this.dialect);
      }
      /**
       * Creates a delete query.
       *
       * Calling this method without `.where()` clause will delete all rows in a table. The `.where()` clause specifies which rows should be deleted.
       *
       * See docs: {@link https://orm.drizzle.team/docs/delete}
       *
       * @param table The table to delete from.
       *
       * @example
       *
       * ```ts
       * // Delete all rows in the 'cars' table
       * await db.delete(cars);
       *
       * // Delete rows with filters and conditions
       * await db.delete(cars).where(eq(cars.color, 'green'));
       *
       * // Delete with returning clause
       * const deletedCar: Car[] = await db.delete(cars)
       *   .where(eq(cars.id, 1))
       *   .returning();
       * ```
       */
      delete(from) {
        return new SQLiteDeleteBase(from, this.session, this.dialect);
      }
      run(query) {
        const sequel = typeof query === "string" ? sql.raw(query) : query.getSQL();
        if (this.resultKind === "async") {
          return new SQLiteRaw(
            async () => this.session.run(sequel),
            () => sequel,
            "run",
            this.dialect,
            this.session.extractRawRunValueFromBatchResult.bind(this.session)
          );
        }
        return this.session.run(sequel);
      }
      all(query) {
        const sequel = typeof query === "string" ? sql.raw(query) : query.getSQL();
        if (this.resultKind === "async") {
          return new SQLiteRaw(
            async () => this.session.all(sequel),
            () => sequel,
            "all",
            this.dialect,
            this.session.extractRawAllValueFromBatchResult.bind(this.session)
          );
        }
        return this.session.all(sequel);
      }
      get(query) {
        const sequel = typeof query === "string" ? sql.raw(query) : query.getSQL();
        if (this.resultKind === "async") {
          return new SQLiteRaw(
            async () => this.session.get(sequel),
            () => sequel,
            "get",
            this.dialect,
            this.session.extractRawGetValueFromBatchResult.bind(this.session)
          );
        }
        return this.session.get(sequel);
      }
      values(query) {
        const sequel = typeof query === "string" ? sql.raw(query) : query.getSQL();
        if (this.resultKind === "async") {
          return new SQLiteRaw(
            async () => this.session.values(sequel),
            () => sequel,
            "values",
            this.dialect,
            this.session.extractRawValuesValueFromBatchResult.bind(this.session)
          );
        }
        return this.session.values(sequel);
      }
      transaction(transaction, config) {
        return this.session.transaction(transaction, config);
      }
    };
  }
});

// ../node_modules/drizzle-orm/cache/core/cache.js
async function hashQuery(sql2, params) {
  const dataToHash = `${sql2}-${JSON.stringify(params)}`;
  const encoder2 = new TextEncoder();
  const data = encoder2.encode(dataToHash);
  const hashBuffer = await crypto.subtle.digest("SHA-256", data);
  const hashArray = [...new Uint8Array(hashBuffer)];
  const hashHex = hashArray.map((b) => b.toString(16).padStart(2, "0")).join("");
  return hashHex;
}
var Cache, NoopCache;
var init_cache = __esm({
  "../node_modules/drizzle-orm/cache/core/cache.js"() {
    init_functionsRoutes_0_4727514041666032();
    init_entity();
    Cache = class {
      static {
        __name(this, "Cache");
      }
      static [entityKind] = "Cache";
    };
    NoopCache = class extends Cache {
      static {
        __name(this, "NoopCache");
      }
      strategy() {
        return "all";
      }
      static [entityKind] = "NoopCache";
      async get(_key2) {
        return void 0;
      }
      async put(_hashedQuery, _response, _tables, _config) {
      }
      async onMutate(_params) {
      }
    };
    __name(hashQuery, "hashQuery");
  }
});

// ../node_modules/drizzle-orm/cache/core/index.js
var init_core = __esm({
  "../node_modules/drizzle-orm/cache/core/index.js"() {
    init_functionsRoutes_0_4727514041666032();
    init_cache();
  }
});

// ../node_modules/drizzle-orm/sqlite-core/alias.js
var init_alias2 = __esm({
  "../node_modules/drizzle-orm/sqlite-core/alias.js"() {
    init_functionsRoutes_0_4727514041666032();
  }
});

// ../node_modules/drizzle-orm/sqlite-core/session.js
var ExecuteResultSync, SQLitePreparedQuery, SQLiteSession, SQLiteTransaction;
var init_session = __esm({
  "../node_modules/drizzle-orm/sqlite-core/session.js"() {
    init_functionsRoutes_0_4727514041666032();
    init_cache();
    init_entity();
    init_errors();
    init_query_promise();
    init_db();
    ExecuteResultSync = class extends QueryPromise {
      static {
        __name(this, "ExecuteResultSync");
      }
      constructor(resultCb) {
        super();
        this.resultCb = resultCb;
      }
      static [entityKind] = "ExecuteResultSync";
      async execute() {
        return this.resultCb();
      }
      sync() {
        return this.resultCb();
      }
    };
    SQLitePreparedQuery = class {
      static {
        __name(this, "SQLitePreparedQuery");
      }
      constructor(mode, executeMethod, query, cache2, queryMetadata, cacheConfig) {
        this.mode = mode;
        this.executeMethod = executeMethod;
        this.query = query;
        this.cache = cache2;
        this.queryMetadata = queryMetadata;
        this.cacheConfig = cacheConfig;
        if (cache2 && cache2.strategy() === "all" && cacheConfig === void 0) {
          this.cacheConfig = { enable: true, autoInvalidate: true };
        }
        if (!this.cacheConfig?.enable) {
          this.cacheConfig = void 0;
        }
      }
      static [entityKind] = "PreparedQuery";
      /** @internal */
      joinsNotNullableMap;
      /** @internal */
      async queryWithCache(queryString, params, query) {
        if (this.cache === void 0 || is(this.cache, NoopCache) || this.queryMetadata === void 0) {
          try {
            return await query();
          } catch (e) {
            throw new DrizzleQueryError(queryString, params, e);
          }
        }
        if (this.cacheConfig && !this.cacheConfig.enable) {
          try {
            return await query();
          } catch (e) {
            throw new DrizzleQueryError(queryString, params, e);
          }
        }
        if ((this.queryMetadata.type === "insert" || this.queryMetadata.type === "update" || this.queryMetadata.type === "delete") && this.queryMetadata.tables.length > 0) {
          try {
            const [res] = await Promise.all([
              query(),
              this.cache.onMutate({ tables: this.queryMetadata.tables })
            ]);
            return res;
          } catch (e) {
            throw new DrizzleQueryError(queryString, params, e);
          }
        }
        if (!this.cacheConfig) {
          try {
            return await query();
          } catch (e) {
            throw new DrizzleQueryError(queryString, params, e);
          }
        }
        if (this.queryMetadata.type === "select") {
          const fromCache = await this.cache.get(
            this.cacheConfig.tag ?? await hashQuery(queryString, params),
            this.queryMetadata.tables,
            this.cacheConfig.tag !== void 0,
            this.cacheConfig.autoInvalidate
          );
          if (fromCache === void 0) {
            let result;
            try {
              result = await query();
            } catch (e) {
              throw new DrizzleQueryError(queryString, params, e);
            }
            await this.cache.put(
              this.cacheConfig.tag ?? await hashQuery(queryString, params),
              result,
              // make sure we send tables that were used in a query only if user wants to invalidate it on each write
              this.cacheConfig.autoInvalidate ? this.queryMetadata.tables : [],
              this.cacheConfig.tag !== void 0,
              this.cacheConfig.config
            );
            return result;
          }
          return fromCache;
        }
        try {
          return await query();
        } catch (e) {
          throw new DrizzleQueryError(queryString, params, e);
        }
      }
      getQuery() {
        return this.query;
      }
      mapRunResult(result, _isFromBatch) {
        return result;
      }
      mapAllResult(_result, _isFromBatch) {
        throw new Error("Not implemented");
      }
      mapGetResult(_result, _isFromBatch) {
        throw new Error("Not implemented");
      }
      execute(placeholderValues) {
        if (this.mode === "async") {
          return this[this.executeMethod](placeholderValues);
        }
        return new ExecuteResultSync(() => this[this.executeMethod](placeholderValues));
      }
      mapResult(response, isFromBatch) {
        switch (this.executeMethod) {
          case "run": {
            return this.mapRunResult(response, isFromBatch);
          }
          case "all": {
            return this.mapAllResult(response, isFromBatch);
          }
          case "get": {
            return this.mapGetResult(response, isFromBatch);
          }
        }
      }
    };
    SQLiteSession = class {
      static {
        __name(this, "SQLiteSession");
      }
      constructor(dialect) {
        this.dialect = dialect;
      }
      static [entityKind] = "SQLiteSession";
      prepareOneTimeQuery(query, fields, executeMethod, isResponseInArrayMode, customResultMapper, queryMetadata, cacheConfig) {
        return this.prepareQuery(
          query,
          fields,
          executeMethod,
          isResponseInArrayMode,
          customResultMapper,
          queryMetadata,
          cacheConfig
        );
      }
      run(query) {
        const staticQuery = this.dialect.sqlToQuery(query);
        try {
          return this.prepareOneTimeQuery(staticQuery, void 0, "run", false).run();
        } catch (err) {
          throw new DrizzleError({ cause: err, message: `Failed to run the query '${staticQuery.sql}'` });
        }
      }
      /** @internal */
      extractRawRunValueFromBatchResult(result) {
        return result;
      }
      all(query) {
        return this.prepareOneTimeQuery(this.dialect.sqlToQuery(query), void 0, "run", false).all();
      }
      /** @internal */
      extractRawAllValueFromBatchResult(_result) {
        throw new Error("Not implemented");
      }
      get(query) {
        return this.prepareOneTimeQuery(this.dialect.sqlToQuery(query), void 0, "run", false).get();
      }
      /** @internal */
      extractRawGetValueFromBatchResult(_result) {
        throw new Error("Not implemented");
      }
      values(query) {
        return this.prepareOneTimeQuery(this.dialect.sqlToQuery(query), void 0, "run", false).values();
      }
      async count(sql2) {
        const result = await this.values(sql2);
        return result[0][0];
      }
      /** @internal */
      extractRawValuesValueFromBatchResult(_result) {
        throw new Error("Not implemented");
      }
    };
    SQLiteTransaction = class extends BaseSQLiteDatabase {
      static {
        __name(this, "SQLiteTransaction");
      }
      constructor(resultType, dialect, session, schema, nestedIndex = 0) {
        super(resultType, dialect, session, schema);
        this.schema = schema;
        this.nestedIndex = nestedIndex;
      }
      static [entityKind] = "SQLiteTransaction";
      rollback() {
        throw new TransactionRollbackError();
      }
    };
  }
});

// ../node_modules/drizzle-orm/sqlite-core/subquery.js
var init_subquery2 = __esm({
  "../node_modules/drizzle-orm/sqlite-core/subquery.js"() {
    init_functionsRoutes_0_4727514041666032();
  }
});

// ../node_modules/drizzle-orm/sqlite-core/view.js
var ViewBuilderCore, ViewBuilder, ManualViewBuilder, SQLiteView;
var init_view = __esm({
  "../node_modules/drizzle-orm/sqlite-core/view.js"() {
    init_functionsRoutes_0_4727514041666032();
    init_entity();
    init_selection_proxy();
    init_utils();
    init_query_builder2();
    init_table3();
    init_view_base();
    ViewBuilderCore = class {
      static {
        __name(this, "ViewBuilderCore");
      }
      constructor(name) {
        this.name = name;
      }
      static [entityKind] = "SQLiteViewBuilderCore";
      config = {};
    };
    ViewBuilder = class extends ViewBuilderCore {
      static {
        __name(this, "ViewBuilder");
      }
      static [entityKind] = "SQLiteViewBuilder";
      as(qb) {
        if (typeof qb === "function") {
          qb = qb(new QueryBuilder());
        }
        const selectionProxy = new SelectionProxyHandler({
          alias: this.name,
          sqlBehavior: "error",
          sqlAliasedBehavior: "alias",
          replaceOriginalName: true
        });
        const aliasedSelectedFields = qb.getSelectedFields();
        return new Proxy(
          new SQLiteView({
            // sqliteConfig: this.config,
            config: {
              name: this.name,
              schema: void 0,
              selectedFields: aliasedSelectedFields,
              query: qb.getSQL().inlineParams()
            }
          }),
          selectionProxy
        );
      }
    };
    ManualViewBuilder = class extends ViewBuilderCore {
      static {
        __name(this, "ManualViewBuilder");
      }
      static [entityKind] = "SQLiteManualViewBuilder";
      columns;
      constructor(name, columns) {
        super(name);
        this.columns = getTableColumns(sqliteTable(name, columns));
      }
      existing() {
        return new Proxy(
          new SQLiteView({
            config: {
              name: this.name,
              schema: void 0,
              selectedFields: this.columns,
              query: void 0
            }
          }),
          new SelectionProxyHandler({
            alias: this.name,
            sqlBehavior: "error",
            sqlAliasedBehavior: "alias",
            replaceOriginalName: true
          })
        );
      }
      as(query) {
        return new Proxy(
          new SQLiteView({
            config: {
              name: this.name,
              schema: void 0,
              selectedFields: this.columns,
              query: query.inlineParams()
            }
          }),
          new SelectionProxyHandler({
            alias: this.name,
            sqlBehavior: "error",
            sqlAliasedBehavior: "alias",
            replaceOriginalName: true
          })
        );
      }
    };
    SQLiteView = class extends SQLiteViewBase {
      static {
        __name(this, "SQLiteView");
      }
      static [entityKind] = "SQLiteView";
      constructor({ config }) {
        super(config);
      }
    };
  }
});

// ../node_modules/drizzle-orm/sqlite-core/index.js
var init_sqlite_core = __esm({
  "../node_modules/drizzle-orm/sqlite-core/index.js"() {
    init_functionsRoutes_0_4727514041666032();
    init_alias2();
    init_checks();
    init_columns();
    init_db();
    init_dialect();
    init_foreign_keys2();
    init_indexes();
    init_primary_keys2();
    init_query_builders();
    init_session();
    init_subquery2();
    init_table3();
    init_unique_constraint2();
    init_utils2();
    init_view();
  }
});

// ../node_modules/drizzle-orm/d1/session.js
function d1ToRawMapping(results) {
  const rows = [];
  for (const row of results) {
    const entry = Object.keys(row).map((k) => row[k]);
    rows.push(entry);
  }
  return rows;
}
var SQLiteD1Session, D1Transaction, D1PreparedQuery;
var init_session2 = __esm({
  "../node_modules/drizzle-orm/d1/session.js"() {
    init_functionsRoutes_0_4727514041666032();
    init_core();
    init_entity();
    init_logger();
    init_sql();
    init_sqlite_core();
    init_session();
    init_utils();
    SQLiteD1Session = class extends SQLiteSession {
      static {
        __name(this, "SQLiteD1Session");
      }
      constructor(client, dialect, schema, options = {}) {
        super(dialect);
        this.client = client;
        this.schema = schema;
        this.options = options;
        this.logger = options.logger ?? new NoopLogger();
        this.cache = options.cache ?? new NoopCache();
      }
      static [entityKind] = "SQLiteD1Session";
      logger;
      cache;
      prepareQuery(query, fields, executeMethod, isResponseInArrayMode, customResultMapper, queryMetadata, cacheConfig) {
        const stmt = this.client.prepare(query.sql);
        return new D1PreparedQuery(
          stmt,
          query,
          this.logger,
          this.cache,
          queryMetadata,
          cacheConfig,
          fields,
          executeMethod,
          isResponseInArrayMode,
          customResultMapper
        );
      }
      async batch(queries) {
        const preparedQueries = [];
        const builtQueries = [];
        for (const query of queries) {
          const preparedQuery = query._prepare();
          const builtQuery = preparedQuery.getQuery();
          preparedQueries.push(preparedQuery);
          if (builtQuery.params.length > 0) {
            builtQueries.push(preparedQuery.stmt.bind(...builtQuery.params));
          } else {
            const builtQuery2 = preparedQuery.getQuery();
            builtQueries.push(
              this.client.prepare(builtQuery2.sql).bind(...builtQuery2.params)
            );
          }
        }
        const batchResults = await this.client.batch(builtQueries);
        return batchResults.map((result, i) => preparedQueries[i].mapResult(result, true));
      }
      extractRawAllValueFromBatchResult(result) {
        return result.results;
      }
      extractRawGetValueFromBatchResult(result) {
        return result.results[0];
      }
      extractRawValuesValueFromBatchResult(result) {
        return d1ToRawMapping(result.results);
      }
      async transaction(transaction, config) {
        const tx = new D1Transaction("async", this.dialect, this, this.schema);
        await this.run(sql.raw(`begin${config?.behavior ? " " + config.behavior : ""}`));
        try {
          const result = await transaction(tx);
          await this.run(sql`commit`);
          return result;
        } catch (err) {
          await this.run(sql`rollback`);
          throw err;
        }
      }
    };
    D1Transaction = class _D1Transaction extends SQLiteTransaction {
      static {
        __name(this, "D1Transaction");
      }
      static [entityKind] = "D1Transaction";
      async transaction(transaction) {
        const savepointName = `sp${this.nestedIndex}`;
        const tx = new _D1Transaction("async", this.dialect, this.session, this.schema, this.nestedIndex + 1);
        await this.session.run(sql.raw(`savepoint ${savepointName}`));
        try {
          const result = await transaction(tx);
          await this.session.run(sql.raw(`release savepoint ${savepointName}`));
          return result;
        } catch (err) {
          await this.session.run(sql.raw(`rollback to savepoint ${savepointName}`));
          throw err;
        }
      }
    };
    __name(d1ToRawMapping, "d1ToRawMapping");
    D1PreparedQuery = class extends SQLitePreparedQuery {
      static {
        __name(this, "D1PreparedQuery");
      }
      constructor(stmt, query, logger, cache2, queryMetadata, cacheConfig, fields, executeMethod, _isResponseInArrayMode, customResultMapper) {
        super("async", executeMethod, query, cache2, queryMetadata, cacheConfig);
        this.logger = logger;
        this._isResponseInArrayMode = _isResponseInArrayMode;
        this.customResultMapper = customResultMapper;
        this.fields = fields;
        this.stmt = stmt;
      }
      static [entityKind] = "D1PreparedQuery";
      /** @internal */
      customResultMapper;
      /** @internal */
      fields;
      /** @internal */
      stmt;
      async run(placeholderValues) {
        const params = fillPlaceholders(this.query.params, placeholderValues ?? {});
        this.logger.logQuery(this.query.sql, params);
        return await this.queryWithCache(this.query.sql, params, async () => {
          return this.stmt.bind(...params).run();
        });
      }
      async all(placeholderValues) {
        const { fields, query, logger, stmt, customResultMapper } = this;
        if (!fields && !customResultMapper) {
          const params = fillPlaceholders(query.params, placeholderValues ?? {});
          logger.logQuery(query.sql, params);
          return await this.queryWithCache(query.sql, params, async () => {
            return stmt.bind(...params).all().then(({ results }) => this.mapAllResult(results));
          });
        }
        const rows = await this.values(placeholderValues);
        return this.mapAllResult(rows);
      }
      mapAllResult(rows, isFromBatch) {
        if (isFromBatch) {
          rows = d1ToRawMapping(rows.results);
        }
        if (!this.fields && !this.customResultMapper) {
          return rows;
        }
        if (this.customResultMapper) {
          return this.customResultMapper(rows);
        }
        return rows.map((row) => mapResultRow(this.fields, row, this.joinsNotNullableMap));
      }
      async get(placeholderValues) {
        const { fields, joinsNotNullableMap, query, logger, stmt, customResultMapper } = this;
        if (!fields && !customResultMapper) {
          const params = fillPlaceholders(query.params, placeholderValues ?? {});
          logger.logQuery(query.sql, params);
          return await this.queryWithCache(query.sql, params, async () => {
            return stmt.bind(...params).all().then(({ results }) => results[0]);
          });
        }
        const rows = await this.values(placeholderValues);
        if (!rows[0]) {
          return void 0;
        }
        if (customResultMapper) {
          return customResultMapper(rows);
        }
        return mapResultRow(fields, rows[0], joinsNotNullableMap);
      }
      mapGetResult(result, isFromBatch) {
        if (isFromBatch) {
          result = d1ToRawMapping(result.results)[0];
        }
        if (!this.fields && !this.customResultMapper) {
          return result;
        }
        if (this.customResultMapper) {
          return this.customResultMapper([result]);
        }
        return mapResultRow(this.fields, result, this.joinsNotNullableMap);
      }
      async values(placeholderValues) {
        const params = fillPlaceholders(this.query.params, placeholderValues ?? {});
        this.logger.logQuery(this.query.sql, params);
        return await this.queryWithCache(this.query.sql, params, async () => {
          return this.stmt.bind(...params).raw();
        });
      }
      /** @internal */
      isResponseInArrayMode() {
        return this._isResponseInArrayMode;
      }
    };
  }
});

// ../node_modules/drizzle-orm/d1/driver.js
function drizzle(client, config = {}) {
  const dialect = new SQLiteAsyncDialect({ casing: config.casing });
  let logger;
  if (config.logger === true) {
    logger = new DefaultLogger();
  } else if (config.logger !== false) {
    logger = config.logger;
  }
  let schema;
  if (config.schema) {
    const tablesConfig = extractTablesRelationalConfig(
      config.schema,
      createTableRelationsHelpers
    );
    schema = {
      fullSchema: config.schema,
      schema: tablesConfig.tables,
      tableNamesMap: tablesConfig.tableNamesMap
    };
  }
  const session = new SQLiteD1Session(client, dialect, schema, { logger, cache: config.cache });
  const db = new DrizzleD1Database("async", dialect, session, schema);
  db.$client = client;
  db.$cache = config.cache;
  if (db.$cache) {
    db.$cache["invalidate"] = config.cache?.onMutate;
  }
  return db;
}
var DrizzleD1Database;
var init_driver = __esm({
  "../node_modules/drizzle-orm/d1/driver.js"() {
    init_functionsRoutes_0_4727514041666032();
    init_entity();
    init_logger();
    init_relations();
    init_db();
    init_dialect();
    init_session2();
    DrizzleD1Database = class extends BaseSQLiteDatabase {
      static {
        __name(this, "DrizzleD1Database");
      }
      static [entityKind] = "D1Database";
      async batch(batch) {
        return this.session.batch(batch);
      }
    };
    __name(drizzle, "drizzle");
  }
});

// ../node_modules/drizzle-orm/d1/index.js
var init_d1 = __esm({
  "../node_modules/drizzle-orm/d1/index.js"() {
    init_functionsRoutes_0_4727514041666032();
    init_driver();
    init_session2();
  }
});

// ../node_modules/drizzle-orm/operations.js
var init_operations = __esm({
  "../node_modules/drizzle-orm/operations.js"() {
    init_functionsRoutes_0_4727514041666032();
  }
});

// ../node_modules/drizzle-orm/index.js
var init_drizzle_orm = __esm({
  "../node_modules/drizzle-orm/index.js"() {
    init_functionsRoutes_0_4727514041666032();
    init_alias();
    init_column_builder();
    init_column();
    init_entity();
    init_errors();
    init_logger();
    init_operations();
    init_query_promise();
    init_relations();
    init_sql2();
    init_subquery();
    init_table();
    init_utils();
    init_view_common();
  }
});

// db/schema.ts
var users, profiles, workspaces, subscriptions, inviteCodes;
var init_schema = __esm({
  "db/schema.ts"() {
    init_functionsRoutes_0_4727514041666032();
    init_sqlite_core();
    users = sqliteTable("users", {
      id: text("id").primaryKey(),
      email: text("email").notNull().unique(),
      passwordHash: text("password_hash").notNull(),
      name: text("name"),
      role: text("role", { enum: ["user", "god"] }).default("user"),
      avatarUrl: text("avatar_url"),
      resetToken: text("reset_token"),
      resetExpires: integer("reset_expires", { mode: "timestamp" }),
      createdAt: integer("created_at", { mode: "timestamp" }).$defaultFn(() => /* @__PURE__ */ new Date()),
      updatedAt: integer("updated_at", { mode: "timestamp" }).$defaultFn(() => /* @__PURE__ */ new Date()).$onUpdateFn(() => /* @__PURE__ */ new Date()),
      emailVerified: integer("email_verified", { mode: "boolean" }).default(false),
      verificationToken: text("verification_token")
    }, (table) => ({
      resetTokenIdx: index("reset_token_idx").on(table.resetToken)
    }));
    profiles = sqliteTable("profiles", {
      userId: text("user_id").primaryKey().references(() => users.id, { onDelete: "cascade" }),
      firstName: text("first_name"),
      lastName: text("last_name"),
      jobTitle: text("job_title"),
      organization: text("organization"),
      bio: text("bio"),
      skills: text("skills"),
      location: text("location")
    });
    workspaces = sqliteTable("workspaces", {
      id: text("id").primaryKey(),
      ownerId: text("owner_id").notNull().references(() => users.id, { onDelete: "cascade" }),
      name: text("name").notNull(),
      slug: text("slug").notNull().unique(),
      createdAt: integer("created_at", { mode: "timestamp" }).$defaultFn(() => /* @__PURE__ */ new Date())
    }, (table) => ({
      ownerIdIdx: index("owner_id_idx").on(table.ownerId)
    }));
    subscriptions = sqliteTable("subscriptions", {
      workspaceId: text("workspace_id").primaryKey().references(() => workspaces.id, { onDelete: "cascade" }),
      plan: text("plan", { enum: ["free", "solo", "collective", "business", "major"] }).default("free"),
      pdfExportsLimit: integer("pdf_exports_limit").default(1),
      pdfExportsUsed: integer("pdf_exports_used").default(0),
      aiCreditsLimit: integer("ai_credits_limit").default(100),
      aiCreditsUsed: integer("ai_credits_used").default(0),
      expiresAt: integer("expires_at", { mode: "timestamp" })
    });
    inviteCodes = sqliteTable("invite_codes", {
      code: text("code").primaryKey(),
      workspaceId: text("workspace_id").notNull().references(() => workspaces.id, { onDelete: "cascade" }),
      plan: text("plan", { enum: ["free", "solo", "collective", "business", "major", "semi_god", "god"] }).notNull(),
      durationMonths: integer("duration_months").notNull().default(0),
      // 0 = eternal
      maxUses: integer("max_uses").default(1),
      usesCount: integer("uses_count").default(0),
      expiresAt: integer("expires_at", { mode: "timestamp" }),
      // code redemption deadline
      note: text("note"),
      createdAt: integer("created_at", { mode: "timestamp" }).$defaultFn(() => /* @__PURE__ */ new Date())
    }, (table) => ({
      workspaceIdIdx: index("invite_codes_workspace_id_idx").on(table.workspaceId)
    }));
  }
});

// ../node_modules/jose/dist/webapi/lib/buffer_utils.js
function concat(...buffers) {
  const size = buffers.reduce((acc, { length }) => acc + length, 0);
  const buf = new Uint8Array(size);
  let i = 0;
  for (const buffer of buffers) {
    buf.set(buffer, i);
    i += buffer.length;
  }
  return buf;
}
function encode(string) {
  const bytes = new Uint8Array(string.length);
  for (let i = 0; i < string.length; i++) {
    const code = string.charCodeAt(i);
    if (code > 127) {
      throw new TypeError("non-ASCII string encountered in encode()");
    }
    bytes[i] = code;
  }
  return bytes;
}
var encoder, decoder, MAX_INT32;
var init_buffer_utils = __esm({
  "../node_modules/jose/dist/webapi/lib/buffer_utils.js"() {
    init_functionsRoutes_0_4727514041666032();
    encoder = new TextEncoder();
    decoder = new TextDecoder();
    MAX_INT32 = 2 ** 32;
    __name(concat, "concat");
    __name(encode, "encode");
  }
});

// ../node_modules/jose/dist/webapi/lib/base64.js
function encodeBase64(input) {
  if (Uint8Array.prototype.toBase64) {
    return input.toBase64();
  }
  const CHUNK_SIZE = 32768;
  const arr = [];
  for (let i = 0; i < input.length; i += CHUNK_SIZE) {
    arr.push(String.fromCharCode.apply(null, input.subarray(i, i + CHUNK_SIZE)));
  }
  return btoa(arr.join(""));
}
function decodeBase64(encoded) {
  if (Uint8Array.fromBase64) {
    return Uint8Array.fromBase64(encoded);
  }
  const binary = atob(encoded);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) {
    bytes[i] = binary.charCodeAt(i);
  }
  return bytes;
}
var init_base64 = __esm({
  "../node_modules/jose/dist/webapi/lib/base64.js"() {
    init_functionsRoutes_0_4727514041666032();
    __name(encodeBase64, "encodeBase64");
    __name(decodeBase64, "decodeBase64");
  }
});

// ../node_modules/jose/dist/webapi/util/base64url.js
function decode(input) {
  if (Uint8Array.fromBase64) {
    return Uint8Array.fromBase64(typeof input === "string" ? input : decoder.decode(input), {
      alphabet: "base64url"
    });
  }
  let encoded = input;
  if (encoded instanceof Uint8Array) {
    encoded = decoder.decode(encoded);
  }
  encoded = encoded.replace(/-/g, "+").replace(/_/g, "/");
  try {
    return decodeBase64(encoded);
  } catch {
    throw new TypeError("The input to be decoded is not correctly encoded.");
  }
}
function encode2(input) {
  let unencoded = input;
  if (typeof unencoded === "string") {
    unencoded = encoder.encode(unencoded);
  }
  if (Uint8Array.prototype.toBase64) {
    return unencoded.toBase64({ alphabet: "base64url", omitPadding: true });
  }
  return encodeBase64(unencoded).replace(/=/g, "").replace(/\+/g, "-").replace(/\//g, "_");
}
var init_base64url = __esm({
  "../node_modules/jose/dist/webapi/util/base64url.js"() {
    init_functionsRoutes_0_4727514041666032();
    init_buffer_utils();
    init_base64();
    __name(decode, "decode");
    __name(encode2, "encode");
  }
});

// ../node_modules/jose/dist/webapi/lib/crypto_key.js
function getHashLength(hash2) {
  return parseInt(hash2.name.slice(4), 10);
}
function checkHashLength(algorithm, expected) {
  const actual = getHashLength(algorithm.hash);
  if (actual !== expected)
    throw unusable(`SHA-${expected}`, "algorithm.hash");
}
function getNamedCurve(alg) {
  switch (alg) {
    case "ES256":
      return "P-256";
    case "ES384":
      return "P-384";
    case "ES512":
      return "P-521";
    default:
      throw new Error("unreachable");
  }
}
function checkUsage(key, usage) {
  if (usage && !key.usages.includes(usage)) {
    throw new TypeError(`CryptoKey does not support this operation, its usages must include ${usage}.`);
  }
}
function checkSigCryptoKey(key, alg, usage) {
  switch (alg) {
    case "HS256":
    case "HS384":
    case "HS512": {
      if (!isAlgorithm(key.algorithm, "HMAC"))
        throw unusable("HMAC");
      checkHashLength(key.algorithm, parseInt(alg.slice(2), 10));
      break;
    }
    case "RS256":
    case "RS384":
    case "RS512": {
      if (!isAlgorithm(key.algorithm, "RSASSA-PKCS1-v1_5"))
        throw unusable("RSASSA-PKCS1-v1_5");
      checkHashLength(key.algorithm, parseInt(alg.slice(2), 10));
      break;
    }
    case "PS256":
    case "PS384":
    case "PS512": {
      if (!isAlgorithm(key.algorithm, "RSA-PSS"))
        throw unusable("RSA-PSS");
      checkHashLength(key.algorithm, parseInt(alg.slice(2), 10));
      break;
    }
    case "Ed25519":
    case "EdDSA": {
      if (!isAlgorithm(key.algorithm, "Ed25519"))
        throw unusable("Ed25519");
      break;
    }
    case "ML-DSA-44":
    case "ML-DSA-65":
    case "ML-DSA-87": {
      if (!isAlgorithm(key.algorithm, alg))
        throw unusable(alg);
      break;
    }
    case "ES256":
    case "ES384":
    case "ES512": {
      if (!isAlgorithm(key.algorithm, "ECDSA"))
        throw unusable("ECDSA");
      const expected = getNamedCurve(alg);
      const actual = key.algorithm.namedCurve;
      if (actual !== expected)
        throw unusable(expected, "algorithm.namedCurve");
      break;
    }
    default:
      throw new TypeError("CryptoKey does not support this operation");
  }
  checkUsage(key, usage);
}
var unusable, isAlgorithm;
var init_crypto_key = __esm({
  "../node_modules/jose/dist/webapi/lib/crypto_key.js"() {
    init_functionsRoutes_0_4727514041666032();
    unusable = /* @__PURE__ */ __name((name, prop = "algorithm.name") => new TypeError(`CryptoKey does not support this operation, its ${prop} must be ${name}`), "unusable");
    isAlgorithm = /* @__PURE__ */ __name((algorithm, name) => algorithm.name === name, "isAlgorithm");
    __name(getHashLength, "getHashLength");
    __name(checkHashLength, "checkHashLength");
    __name(getNamedCurve, "getNamedCurve");
    __name(checkUsage, "checkUsage");
    __name(checkSigCryptoKey, "checkSigCryptoKey");
  }
});

// ../node_modules/jose/dist/webapi/lib/invalid_key_input.js
function message(msg, actual, ...types) {
  types = types.filter(Boolean);
  if (types.length > 2) {
    const last = types.pop();
    msg += `one of type ${types.join(", ")}, or ${last}.`;
  } else if (types.length === 2) {
    msg += `one of type ${types[0]} or ${types[1]}.`;
  } else {
    msg += `of type ${types[0]}.`;
  }
  if (actual == null) {
    msg += ` Received ${actual}`;
  } else if (typeof actual === "function" && actual.name) {
    msg += ` Received function ${actual.name}`;
  } else if (typeof actual === "object" && actual != null) {
    if (actual.constructor?.name) {
      msg += ` Received an instance of ${actual.constructor.name}`;
    }
  }
  return msg;
}
var invalidKeyInput, withAlg;
var init_invalid_key_input = __esm({
  "../node_modules/jose/dist/webapi/lib/invalid_key_input.js"() {
    init_functionsRoutes_0_4727514041666032();
    __name(message, "message");
    invalidKeyInput = /* @__PURE__ */ __name((actual, ...types) => message("Key must be ", actual, ...types), "invalidKeyInput");
    withAlg = /* @__PURE__ */ __name((alg, actual, ...types) => message(`Key for the ${alg} algorithm must be `, actual, ...types), "withAlg");
  }
});

// ../node_modules/jose/dist/webapi/util/errors.js
var JOSEError, JWTClaimValidationFailed, JWTExpired, JOSEAlgNotAllowed, JOSENotSupported, JWSInvalid, JWTInvalid, JWSSignatureVerificationFailed;
var init_errors2 = __esm({
  "../node_modules/jose/dist/webapi/util/errors.js"() {
    init_functionsRoutes_0_4727514041666032();
    JOSEError = class extends Error {
      static {
        __name(this, "JOSEError");
      }
      static code = "ERR_JOSE_GENERIC";
      code = "ERR_JOSE_GENERIC";
      constructor(message2, options) {
        super(message2, options);
        this.name = this.constructor.name;
        Error.captureStackTrace?.(this, this.constructor);
      }
    };
    JWTClaimValidationFailed = class extends JOSEError {
      static {
        __name(this, "JWTClaimValidationFailed");
      }
      static code = "ERR_JWT_CLAIM_VALIDATION_FAILED";
      code = "ERR_JWT_CLAIM_VALIDATION_FAILED";
      claim;
      reason;
      payload;
      constructor(message2, payload, claim = "unspecified", reason = "unspecified") {
        super(message2, { cause: { claim, reason, payload } });
        this.claim = claim;
        this.reason = reason;
        this.payload = payload;
      }
    };
    JWTExpired = class extends JOSEError {
      static {
        __name(this, "JWTExpired");
      }
      static code = "ERR_JWT_EXPIRED";
      code = "ERR_JWT_EXPIRED";
      claim;
      reason;
      payload;
      constructor(message2, payload, claim = "unspecified", reason = "unspecified") {
        super(message2, { cause: { claim, reason, payload } });
        this.claim = claim;
        this.reason = reason;
        this.payload = payload;
      }
    };
    JOSEAlgNotAllowed = class extends JOSEError {
      static {
        __name(this, "JOSEAlgNotAllowed");
      }
      static code = "ERR_JOSE_ALG_NOT_ALLOWED";
      code = "ERR_JOSE_ALG_NOT_ALLOWED";
    };
    JOSENotSupported = class extends JOSEError {
      static {
        __name(this, "JOSENotSupported");
      }
      static code = "ERR_JOSE_NOT_SUPPORTED";
      code = "ERR_JOSE_NOT_SUPPORTED";
    };
    JWSInvalid = class extends JOSEError {
      static {
        __name(this, "JWSInvalid");
      }
      static code = "ERR_JWS_INVALID";
      code = "ERR_JWS_INVALID";
    };
    JWTInvalid = class extends JOSEError {
      static {
        __name(this, "JWTInvalid");
      }
      static code = "ERR_JWT_INVALID";
      code = "ERR_JWT_INVALID";
    };
    JWSSignatureVerificationFailed = class extends JOSEError {
      static {
        __name(this, "JWSSignatureVerificationFailed");
      }
      static code = "ERR_JWS_SIGNATURE_VERIFICATION_FAILED";
      code = "ERR_JWS_SIGNATURE_VERIFICATION_FAILED";
      constructor(message2 = "signature verification failed", options) {
        super(message2, options);
      }
    };
  }
});

// ../node_modules/jose/dist/webapi/lib/is_key_like.js
var isCryptoKey, isKeyObject, isKeyLike;
var init_is_key_like = __esm({
  "../node_modules/jose/dist/webapi/lib/is_key_like.js"() {
    init_functionsRoutes_0_4727514041666032();
    isCryptoKey = /* @__PURE__ */ __name((key) => {
      if (key?.[Symbol.toStringTag] === "CryptoKey")
        return true;
      try {
        return key instanceof CryptoKey;
      } catch {
        return false;
      }
    }, "isCryptoKey");
    isKeyObject = /* @__PURE__ */ __name((key) => key?.[Symbol.toStringTag] === "KeyObject", "isKeyObject");
    isKeyLike = /* @__PURE__ */ __name((key) => isCryptoKey(key) || isKeyObject(key), "isKeyLike");
  }
});

// ../node_modules/jose/dist/webapi/lib/helpers.js
function assertNotSet(value, name) {
  if (value) {
    throw new TypeError(`${name} can only be called once`);
  }
}
function decodeBase64url(value, label, ErrorClass) {
  try {
    return decode(value);
  } catch {
    throw new ErrorClass(`Failed to base64url decode the ${label}`);
  }
}
var init_helpers = __esm({
  "../node_modules/jose/dist/webapi/lib/helpers.js"() {
    init_functionsRoutes_0_4727514041666032();
    init_base64url();
    __name(assertNotSet, "assertNotSet");
    __name(decodeBase64url, "decodeBase64url");
  }
});

// ../node_modules/jose/dist/webapi/lib/type_checks.js
function isObject(input) {
  if (!isObjectLike(input) || Object.prototype.toString.call(input) !== "[object Object]") {
    return false;
  }
  if (Object.getPrototypeOf(input) === null) {
    return true;
  }
  let proto = input;
  while (Object.getPrototypeOf(proto) !== null) {
    proto = Object.getPrototypeOf(proto);
  }
  return Object.getPrototypeOf(input) === proto;
}
function isDisjoint(...headers) {
  const sources = headers.filter(Boolean);
  if (sources.length === 0 || sources.length === 1) {
    return true;
  }
  let acc;
  for (const header of sources) {
    const parameters = Object.keys(header);
    if (!acc || acc.size === 0) {
      acc = new Set(parameters);
      continue;
    }
    for (const parameter of parameters) {
      if (acc.has(parameter)) {
        return false;
      }
      acc.add(parameter);
    }
  }
  return true;
}
var isObjectLike, isJWK, isPrivateJWK, isPublicJWK, isSecretJWK;
var init_type_checks = __esm({
  "../node_modules/jose/dist/webapi/lib/type_checks.js"() {
    init_functionsRoutes_0_4727514041666032();
    isObjectLike = /* @__PURE__ */ __name((value) => typeof value === "object" && value !== null, "isObjectLike");
    __name(isObject, "isObject");
    __name(isDisjoint, "isDisjoint");
    isJWK = /* @__PURE__ */ __name((key) => isObject(key) && typeof key.kty === "string", "isJWK");
    isPrivateJWK = /* @__PURE__ */ __name((key) => key.kty !== "oct" && (key.kty === "AKP" && typeof key.priv === "string" || typeof key.d === "string"), "isPrivateJWK");
    isPublicJWK = /* @__PURE__ */ __name((key) => key.kty !== "oct" && key.d === void 0 && key.priv === void 0, "isPublicJWK");
    isSecretJWK = /* @__PURE__ */ __name((key) => key.kty === "oct" && typeof key.k === "string", "isSecretJWK");
  }
});

// ../node_modules/jose/dist/webapi/lib/signing.js
function checkKeyLength(alg, key) {
  if (alg.startsWith("RS") || alg.startsWith("PS")) {
    const { modulusLength } = key.algorithm;
    if (typeof modulusLength !== "number" || modulusLength < 2048) {
      throw new TypeError(`${alg} requires key modulusLength to be 2048 bits or larger`);
    }
  }
}
function subtleAlgorithm(alg, algorithm) {
  const hash2 = `SHA-${alg.slice(-3)}`;
  switch (alg) {
    case "HS256":
    case "HS384":
    case "HS512":
      return { hash: hash2, name: "HMAC" };
    case "PS256":
    case "PS384":
    case "PS512":
      return { hash: hash2, name: "RSA-PSS", saltLength: parseInt(alg.slice(-3), 10) >> 3 };
    case "RS256":
    case "RS384":
    case "RS512":
      return { hash: hash2, name: "RSASSA-PKCS1-v1_5" };
    case "ES256":
    case "ES384":
    case "ES512":
      return { hash: hash2, name: "ECDSA", namedCurve: algorithm.namedCurve };
    case "Ed25519":
    case "EdDSA":
      return { name: "Ed25519" };
    case "ML-DSA-44":
    case "ML-DSA-65":
    case "ML-DSA-87":
      return { name: alg };
    default:
      throw new JOSENotSupported(`alg ${alg} is not supported either by JOSE or your javascript runtime`);
  }
}
async function getSigKey(alg, key, usage) {
  if (key instanceof Uint8Array) {
    if (!alg.startsWith("HS")) {
      throw new TypeError(invalidKeyInput(key, "CryptoKey", "KeyObject", "JSON Web Key"));
    }
    return crypto.subtle.importKey("raw", key, { hash: `SHA-${alg.slice(-3)}`, name: "HMAC" }, false, [usage]);
  }
  checkSigCryptoKey(key, alg, usage);
  return key;
}
async function sign(alg, key, data) {
  const cryptoKey = await getSigKey(alg, key, "sign");
  checkKeyLength(alg, cryptoKey);
  const signature = await crypto.subtle.sign(subtleAlgorithm(alg, cryptoKey.algorithm), cryptoKey, data);
  return new Uint8Array(signature);
}
async function verify(alg, key, signature, data) {
  const cryptoKey = await getSigKey(alg, key, "verify");
  checkKeyLength(alg, cryptoKey);
  const algorithm = subtleAlgorithm(alg, cryptoKey.algorithm);
  try {
    return await crypto.subtle.verify(algorithm, cryptoKey, signature, data);
  } catch {
    return false;
  }
}
var init_signing = __esm({
  "../node_modules/jose/dist/webapi/lib/signing.js"() {
    init_functionsRoutes_0_4727514041666032();
    init_errors2();
    init_crypto_key();
    init_invalid_key_input();
    __name(checkKeyLength, "checkKeyLength");
    __name(subtleAlgorithm, "subtleAlgorithm");
    __name(getSigKey, "getSigKey");
    __name(sign, "sign");
    __name(verify, "verify");
  }
});

// ../node_modules/jose/dist/webapi/lib/jwk_to_key.js
function subtleMapping(jwk) {
  let algorithm;
  let keyUsages;
  switch (jwk.kty) {
    case "AKP": {
      switch (jwk.alg) {
        case "ML-DSA-44":
        case "ML-DSA-65":
        case "ML-DSA-87":
          algorithm = { name: jwk.alg };
          keyUsages = jwk.priv ? ["sign"] : ["verify"];
          break;
        default:
          throw new JOSENotSupported(unsupportedAlg);
      }
      break;
    }
    case "RSA": {
      switch (jwk.alg) {
        case "PS256":
        case "PS384":
        case "PS512":
          algorithm = { name: "RSA-PSS", hash: `SHA-${jwk.alg.slice(-3)}` };
          keyUsages = jwk.d ? ["sign"] : ["verify"];
          break;
        case "RS256":
        case "RS384":
        case "RS512":
          algorithm = { name: "RSASSA-PKCS1-v1_5", hash: `SHA-${jwk.alg.slice(-3)}` };
          keyUsages = jwk.d ? ["sign"] : ["verify"];
          break;
        case "RSA-OAEP":
        case "RSA-OAEP-256":
        case "RSA-OAEP-384":
        case "RSA-OAEP-512":
          algorithm = {
            name: "RSA-OAEP",
            hash: `SHA-${parseInt(jwk.alg.slice(-3), 10) || 1}`
          };
          keyUsages = jwk.d ? ["decrypt", "unwrapKey"] : ["encrypt", "wrapKey"];
          break;
        default:
          throw new JOSENotSupported(unsupportedAlg);
      }
      break;
    }
    case "EC": {
      switch (jwk.alg) {
        case "ES256":
        case "ES384":
        case "ES512":
          algorithm = {
            name: "ECDSA",
            namedCurve: { ES256: "P-256", ES384: "P-384", ES512: "P-521" }[jwk.alg]
          };
          keyUsages = jwk.d ? ["sign"] : ["verify"];
          break;
        case "ECDH-ES":
        case "ECDH-ES+A128KW":
        case "ECDH-ES+A192KW":
        case "ECDH-ES+A256KW":
          algorithm = { name: "ECDH", namedCurve: jwk.crv };
          keyUsages = jwk.d ? ["deriveBits"] : [];
          break;
        default:
          throw new JOSENotSupported(unsupportedAlg);
      }
      break;
    }
    case "OKP": {
      switch (jwk.alg) {
        case "Ed25519":
        case "EdDSA":
          algorithm = { name: "Ed25519" };
          keyUsages = jwk.d ? ["sign"] : ["verify"];
          break;
        case "ECDH-ES":
        case "ECDH-ES+A128KW":
        case "ECDH-ES+A192KW":
        case "ECDH-ES+A256KW":
          algorithm = { name: jwk.crv };
          keyUsages = jwk.d ? ["deriveBits"] : [];
          break;
        default:
          throw new JOSENotSupported(unsupportedAlg);
      }
      break;
    }
    default:
      throw new JOSENotSupported('Invalid or unsupported JWK "kty" (Key Type) Parameter value');
  }
  return { algorithm, keyUsages };
}
async function jwkToKey(jwk) {
  if (!jwk.alg) {
    throw new TypeError('"alg" argument is required when "jwk.alg" is not present');
  }
  const { algorithm, keyUsages } = subtleMapping(jwk);
  const keyData = { ...jwk };
  if (keyData.kty !== "AKP") {
    delete keyData.alg;
  }
  delete keyData.use;
  return crypto.subtle.importKey("jwk", keyData, algorithm, jwk.ext ?? (jwk.d || jwk.priv ? false : true), jwk.key_ops ?? keyUsages);
}
var unsupportedAlg;
var init_jwk_to_key = __esm({
  "../node_modules/jose/dist/webapi/lib/jwk_to_key.js"() {
    init_functionsRoutes_0_4727514041666032();
    init_errors2();
    unsupportedAlg = 'Invalid or unsupported JWK "alg" (Algorithm) Parameter value';
    __name(subtleMapping, "subtleMapping");
    __name(jwkToKey, "jwkToKey");
  }
});

// ../node_modules/jose/dist/webapi/lib/normalize_key.js
async function normalizeKey(key, alg) {
  if (key instanceof Uint8Array) {
    return key;
  }
  if (isCryptoKey(key)) {
    return key;
  }
  if (isKeyObject(key)) {
    if (key.type === "secret") {
      return key.export();
    }
    if ("toCryptoKey" in key && typeof key.toCryptoKey === "function") {
      try {
        return handleKeyObject(key, alg);
      } catch (err) {
        if (err instanceof TypeError) {
          throw err;
        }
      }
    }
    let jwk = key.export({ format: "jwk" });
    return handleJWK(key, jwk, alg);
  }
  if (isJWK(key)) {
    if (key.k) {
      return decode(key.k);
    }
    return handleJWK(key, key, alg, true);
  }
  throw new Error("unreachable");
}
var unusableForAlg, cache, handleJWK, handleKeyObject;
var init_normalize_key = __esm({
  "../node_modules/jose/dist/webapi/lib/normalize_key.js"() {
    init_functionsRoutes_0_4727514041666032();
    init_type_checks();
    init_base64url();
    init_jwk_to_key();
    init_is_key_like();
    unusableForAlg = "given KeyObject instance cannot be used for this algorithm";
    handleJWK = /* @__PURE__ */ __name(async (key, jwk, alg, freeze = false) => {
      cache ||= /* @__PURE__ */ new WeakMap();
      let cached = cache.get(key);
      if (cached?.[alg]) {
        return cached[alg];
      }
      const cryptoKey = await jwkToKey({ ...jwk, alg });
      if (freeze)
        Object.freeze(key);
      if (!cached) {
        cache.set(key, { [alg]: cryptoKey });
      } else {
        cached[alg] = cryptoKey;
      }
      return cryptoKey;
    }, "handleJWK");
    handleKeyObject = /* @__PURE__ */ __name((keyObject, alg) => {
      cache ||= /* @__PURE__ */ new WeakMap();
      let cached = cache.get(keyObject);
      if (cached?.[alg]) {
        return cached[alg];
      }
      const isPublic = keyObject.type === "public";
      const extractable = isPublic ? true : false;
      let cryptoKey;
      if (keyObject.asymmetricKeyType === "x25519") {
        switch (alg) {
          case "ECDH-ES":
          case "ECDH-ES+A128KW":
          case "ECDH-ES+A192KW":
          case "ECDH-ES+A256KW":
            break;
          default:
            throw new TypeError(unusableForAlg);
        }
        cryptoKey = keyObject.toCryptoKey(keyObject.asymmetricKeyType, extractable, isPublic ? [] : ["deriveBits"]);
      }
      if (keyObject.asymmetricKeyType === "ed25519") {
        if (alg !== "EdDSA" && alg !== "Ed25519") {
          throw new TypeError(unusableForAlg);
        }
        cryptoKey = keyObject.toCryptoKey(keyObject.asymmetricKeyType, extractable, [
          isPublic ? "verify" : "sign"
        ]);
      }
      switch (keyObject.asymmetricKeyType) {
        case "ml-dsa-44":
        case "ml-dsa-65":
        case "ml-dsa-87": {
          if (alg !== keyObject.asymmetricKeyType.toUpperCase()) {
            throw new TypeError(unusableForAlg);
          }
          cryptoKey = keyObject.toCryptoKey(keyObject.asymmetricKeyType, extractable, [
            isPublic ? "verify" : "sign"
          ]);
        }
      }
      if (keyObject.asymmetricKeyType === "rsa") {
        let hash2;
        switch (alg) {
          case "RSA-OAEP":
            hash2 = "SHA-1";
            break;
          case "RS256":
          case "PS256":
          case "RSA-OAEP-256":
            hash2 = "SHA-256";
            break;
          case "RS384":
          case "PS384":
          case "RSA-OAEP-384":
            hash2 = "SHA-384";
            break;
          case "RS512":
          case "PS512":
          case "RSA-OAEP-512":
            hash2 = "SHA-512";
            break;
          default:
            throw new TypeError(unusableForAlg);
        }
        if (alg.startsWith("RSA-OAEP")) {
          return keyObject.toCryptoKey({
            name: "RSA-OAEP",
            hash: hash2
          }, extractable, isPublic ? ["encrypt"] : ["decrypt"]);
        }
        cryptoKey = keyObject.toCryptoKey({
          name: alg.startsWith("PS") ? "RSA-PSS" : "RSASSA-PKCS1-v1_5",
          hash: hash2
        }, extractable, [isPublic ? "verify" : "sign"]);
      }
      if (keyObject.asymmetricKeyType === "ec") {
        const nist = /* @__PURE__ */ new Map([
          ["prime256v1", "P-256"],
          ["secp384r1", "P-384"],
          ["secp521r1", "P-521"]
        ]);
        const namedCurve = nist.get(keyObject.asymmetricKeyDetails?.namedCurve);
        if (!namedCurve) {
          throw new TypeError(unusableForAlg);
        }
        const expectedCurve = { ES256: "P-256", ES384: "P-384", ES512: "P-521" };
        if (expectedCurve[alg] && namedCurve === expectedCurve[alg]) {
          cryptoKey = keyObject.toCryptoKey({
            name: "ECDSA",
            namedCurve
          }, extractable, [isPublic ? "verify" : "sign"]);
        }
        if (alg.startsWith("ECDH-ES")) {
          cryptoKey = keyObject.toCryptoKey({
            name: "ECDH",
            namedCurve
          }, extractable, isPublic ? [] : ["deriveBits"]);
        }
      }
      if (!cryptoKey) {
        throw new TypeError(unusableForAlg);
      }
      if (!cached) {
        cache.set(keyObject, { [alg]: cryptoKey });
      } else {
        cached[alg] = cryptoKey;
      }
      return cryptoKey;
    }, "handleKeyObject");
    __name(normalizeKey, "normalizeKey");
  }
});

// ../node_modules/jose/dist/webapi/lib/validate_crit.js
function validateCrit(Err, recognizedDefault, recognizedOption, protectedHeader, joseHeader) {
  if (joseHeader.crit !== void 0 && protectedHeader?.crit === void 0) {
    throw new Err('"crit" (Critical) Header Parameter MUST be integrity protected');
  }
  if (!protectedHeader || protectedHeader.crit === void 0) {
    return /* @__PURE__ */ new Set();
  }
  if (!Array.isArray(protectedHeader.crit) || protectedHeader.crit.length === 0 || protectedHeader.crit.some((input) => typeof input !== "string" || input.length === 0)) {
    throw new Err('"crit" (Critical) Header Parameter MUST be an array of non-empty strings when present');
  }
  let recognized;
  if (recognizedOption !== void 0) {
    recognized = new Map([...Object.entries(recognizedOption), ...recognizedDefault.entries()]);
  } else {
    recognized = recognizedDefault;
  }
  for (const parameter of protectedHeader.crit) {
    if (!recognized.has(parameter)) {
      throw new JOSENotSupported(`Extension Header Parameter "${parameter}" is not recognized`);
    }
    if (joseHeader[parameter] === void 0) {
      throw new Err(`Extension Header Parameter "${parameter}" is missing`);
    }
    if (recognized.get(parameter) && protectedHeader[parameter] === void 0) {
      throw new Err(`Extension Header Parameter "${parameter}" MUST be integrity protected`);
    }
  }
  return new Set(protectedHeader.crit);
}
var init_validate_crit = __esm({
  "../node_modules/jose/dist/webapi/lib/validate_crit.js"() {
    init_functionsRoutes_0_4727514041666032();
    init_errors2();
    __name(validateCrit, "validateCrit");
  }
});

// ../node_modules/jose/dist/webapi/lib/validate_algorithms.js
function validateAlgorithms(option, algorithms) {
  if (algorithms !== void 0 && (!Array.isArray(algorithms) || algorithms.some((s) => typeof s !== "string"))) {
    throw new TypeError(`"${option}" option must be an array of strings`);
  }
  if (!algorithms) {
    return void 0;
  }
  return new Set(algorithms);
}
var init_validate_algorithms = __esm({
  "../node_modules/jose/dist/webapi/lib/validate_algorithms.js"() {
    init_functionsRoutes_0_4727514041666032();
    __name(validateAlgorithms, "validateAlgorithms");
  }
});

// ../node_modules/jose/dist/webapi/lib/check_key_type.js
function checkKeyType(alg, key, usage) {
  switch (alg.substring(0, 2)) {
    case "A1":
    case "A2":
    case "di":
    case "HS":
    case "PB":
      symmetricTypeCheck(alg, key, usage);
      break;
    default:
      asymmetricTypeCheck(alg, key, usage);
  }
}
var tag, jwkMatchesOp, symmetricTypeCheck, asymmetricTypeCheck;
var init_check_key_type = __esm({
  "../node_modules/jose/dist/webapi/lib/check_key_type.js"() {
    init_functionsRoutes_0_4727514041666032();
    init_invalid_key_input();
    init_is_key_like();
    init_type_checks();
    tag = /* @__PURE__ */ __name((key) => key?.[Symbol.toStringTag], "tag");
    jwkMatchesOp = /* @__PURE__ */ __name((alg, key, usage) => {
      if (key.use !== void 0) {
        let expected;
        switch (usage) {
          case "sign":
          case "verify":
            expected = "sig";
            break;
          case "encrypt":
          case "decrypt":
            expected = "enc";
            break;
        }
        if (key.use !== expected) {
          throw new TypeError(`Invalid key for this operation, its "use" must be "${expected}" when present`);
        }
      }
      if (key.alg !== void 0 && key.alg !== alg) {
        throw new TypeError(`Invalid key for this operation, its "alg" must be "${alg}" when present`);
      }
      if (Array.isArray(key.key_ops)) {
        let expectedKeyOp;
        switch (true) {
          case (usage === "sign" || usage === "verify"):
          case alg === "dir":
          case alg.includes("CBC-HS"):
            expectedKeyOp = usage;
            break;
          case alg.startsWith("PBES2"):
            expectedKeyOp = "deriveBits";
            break;
          case /^A\d{3}(?:GCM)?(?:KW)?$/.test(alg):
            if (!alg.includes("GCM") && alg.endsWith("KW")) {
              expectedKeyOp = usage === "encrypt" ? "wrapKey" : "unwrapKey";
            } else {
              expectedKeyOp = usage;
            }
            break;
          case (usage === "encrypt" && alg.startsWith("RSA")):
            expectedKeyOp = "wrapKey";
            break;
          case usage === "decrypt":
            expectedKeyOp = alg.startsWith("RSA") ? "unwrapKey" : "deriveBits";
            break;
        }
        if (expectedKeyOp && key.key_ops?.includes?.(expectedKeyOp) === false) {
          throw new TypeError(`Invalid key for this operation, its "key_ops" must include "${expectedKeyOp}" when present`);
        }
      }
      return true;
    }, "jwkMatchesOp");
    symmetricTypeCheck = /* @__PURE__ */ __name((alg, key, usage) => {
      if (key instanceof Uint8Array)
        return;
      if (isJWK(key)) {
        if (isSecretJWK(key) && jwkMatchesOp(alg, key, usage))
          return;
        throw new TypeError(`JSON Web Key for symmetric algorithms must have JWK "kty" (Key Type) equal to "oct" and the JWK "k" (Key Value) present`);
      }
      if (!isKeyLike(key)) {
        throw new TypeError(withAlg(alg, key, "CryptoKey", "KeyObject", "JSON Web Key", "Uint8Array"));
      }
      if (key.type !== "secret") {
        throw new TypeError(`${tag(key)} instances for symmetric algorithms must be of type "secret"`);
      }
    }, "symmetricTypeCheck");
    asymmetricTypeCheck = /* @__PURE__ */ __name((alg, key, usage) => {
      if (isJWK(key)) {
        switch (usage) {
          case "decrypt":
          case "sign":
            if (isPrivateJWK(key) && jwkMatchesOp(alg, key, usage))
              return;
            throw new TypeError(`JSON Web Key for this operation must be a private JWK`);
          case "encrypt":
          case "verify":
            if (isPublicJWK(key) && jwkMatchesOp(alg, key, usage))
              return;
            throw new TypeError(`JSON Web Key for this operation must be a public JWK`);
        }
      }
      if (!isKeyLike(key)) {
        throw new TypeError(withAlg(alg, key, "CryptoKey", "KeyObject", "JSON Web Key"));
      }
      if (key.type === "secret") {
        throw new TypeError(`${tag(key)} instances for asymmetric algorithms must not be of type "secret"`);
      }
      if (key.type === "public") {
        switch (usage) {
          case "sign":
            throw new TypeError(`${tag(key)} instances for asymmetric algorithm signing must be of type "private"`);
          case "decrypt":
            throw new TypeError(`${tag(key)} instances for asymmetric algorithm decryption must be of type "private"`);
        }
      }
      if (key.type === "private") {
        switch (usage) {
          case "verify":
            throw new TypeError(`${tag(key)} instances for asymmetric algorithm verifying must be of type "public"`);
          case "encrypt":
            throw new TypeError(`${tag(key)} instances for asymmetric algorithm encryption must be of type "public"`);
        }
      }
    }, "asymmetricTypeCheck");
    __name(checkKeyType, "checkKeyType");
  }
});

// ../node_modules/jose/dist/webapi/jws/flattened/verify.js
async function flattenedVerify(jws, key, options) {
  if (!isObject(jws)) {
    throw new JWSInvalid("Flattened JWS must be an object");
  }
  if (jws.protected === void 0 && jws.header === void 0) {
    throw new JWSInvalid('Flattened JWS must have either of the "protected" or "header" members');
  }
  if (jws.protected !== void 0 && typeof jws.protected !== "string") {
    throw new JWSInvalid("JWS Protected Header incorrect type");
  }
  if (jws.payload === void 0) {
    throw new JWSInvalid("JWS Payload missing");
  }
  if (typeof jws.signature !== "string") {
    throw new JWSInvalid("JWS Signature missing or incorrect type");
  }
  if (jws.header !== void 0 && !isObject(jws.header)) {
    throw new JWSInvalid("JWS Unprotected Header incorrect type");
  }
  let parsedProt = {};
  if (jws.protected) {
    try {
      const protectedHeader = decode(jws.protected);
      parsedProt = JSON.parse(decoder.decode(protectedHeader));
    } catch {
      throw new JWSInvalid("JWS Protected Header is invalid");
    }
  }
  if (!isDisjoint(parsedProt, jws.header)) {
    throw new JWSInvalid("JWS Protected and JWS Unprotected Header Parameter names must be disjoint");
  }
  const joseHeader = {
    ...parsedProt,
    ...jws.header
  };
  const extensions = validateCrit(JWSInvalid, /* @__PURE__ */ new Map([["b64", true]]), options?.crit, parsedProt, joseHeader);
  let b64 = true;
  if (extensions.has("b64")) {
    b64 = parsedProt.b64;
    if (typeof b64 !== "boolean") {
      throw new JWSInvalid('The "b64" (base64url-encode payload) Header Parameter must be a boolean');
    }
  }
  const { alg } = joseHeader;
  if (typeof alg !== "string" || !alg) {
    throw new JWSInvalid('JWS "alg" (Algorithm) Header Parameter missing or invalid');
  }
  const algorithms = options && validateAlgorithms("algorithms", options.algorithms);
  if (algorithms && !algorithms.has(alg)) {
    throw new JOSEAlgNotAllowed('"alg" (Algorithm) Header Parameter value not allowed');
  }
  if (b64) {
    if (typeof jws.payload !== "string") {
      throw new JWSInvalid("JWS Payload must be a string");
    }
  } else if (typeof jws.payload !== "string" && !(jws.payload instanceof Uint8Array)) {
    throw new JWSInvalid("JWS Payload must be a string or an Uint8Array instance");
  }
  let resolvedKey = false;
  if (typeof key === "function") {
    key = await key(parsedProt, jws);
    resolvedKey = true;
  }
  checkKeyType(alg, key, "verify");
  const data = concat(jws.protected !== void 0 ? encode(jws.protected) : new Uint8Array(), encode("."), typeof jws.payload === "string" ? b64 ? encode(jws.payload) : encoder.encode(jws.payload) : jws.payload);
  const signature = decodeBase64url(jws.signature, "signature", JWSInvalid);
  const k = await normalizeKey(key, alg);
  const verified = await verify(alg, k, signature, data);
  if (!verified) {
    throw new JWSSignatureVerificationFailed();
  }
  let payload;
  if (b64) {
    payload = decodeBase64url(jws.payload, "payload", JWSInvalid);
  } else if (typeof jws.payload === "string") {
    payload = encoder.encode(jws.payload);
  } else {
    payload = jws.payload;
  }
  const result = { payload };
  if (jws.protected !== void 0) {
    result.protectedHeader = parsedProt;
  }
  if (jws.header !== void 0) {
    result.unprotectedHeader = jws.header;
  }
  if (resolvedKey) {
    return { ...result, key: k };
  }
  return result;
}
var init_verify = __esm({
  "../node_modules/jose/dist/webapi/jws/flattened/verify.js"() {
    init_functionsRoutes_0_4727514041666032();
    init_base64url();
    init_signing();
    init_errors2();
    init_buffer_utils();
    init_helpers();
    init_type_checks();
    init_type_checks();
    init_check_key_type();
    init_validate_crit();
    init_validate_algorithms();
    init_normalize_key();
    __name(flattenedVerify, "flattenedVerify");
  }
});

// ../node_modules/jose/dist/webapi/jws/compact/verify.js
async function compactVerify(jws, key, options) {
  if (jws instanceof Uint8Array) {
    jws = decoder.decode(jws);
  }
  if (typeof jws !== "string") {
    throw new JWSInvalid("Compact JWS must be a string or Uint8Array");
  }
  const { 0: protectedHeader, 1: payload, 2: signature, length } = jws.split(".");
  if (length !== 3) {
    throw new JWSInvalid("Invalid Compact JWS");
  }
  const verified = await flattenedVerify({ payload, protected: protectedHeader, signature }, key, options);
  const result = { payload: verified.payload, protectedHeader: verified.protectedHeader };
  if (typeof key === "function") {
    return { ...result, key: verified.key };
  }
  return result;
}
var init_verify2 = __esm({
  "../node_modules/jose/dist/webapi/jws/compact/verify.js"() {
    init_functionsRoutes_0_4727514041666032();
    init_verify();
    init_errors2();
    init_buffer_utils();
    __name(compactVerify, "compactVerify");
  }
});

// ../node_modules/jose/dist/webapi/lib/jwt_claims_set.js
function secs(str) {
  const matched = REGEX.exec(str);
  if (!matched || matched[4] && matched[1]) {
    throw new TypeError("Invalid time period format");
  }
  const value = parseFloat(matched[2]);
  const unit = matched[3].toLowerCase();
  let numericDate;
  switch (unit) {
    case "sec":
    case "secs":
    case "second":
    case "seconds":
    case "s":
      numericDate = Math.round(value);
      break;
    case "minute":
    case "minutes":
    case "min":
    case "mins":
    case "m":
      numericDate = Math.round(value * minute);
      break;
    case "hour":
    case "hours":
    case "hr":
    case "hrs":
    case "h":
      numericDate = Math.round(value * hour);
      break;
    case "day":
    case "days":
    case "d":
      numericDate = Math.round(value * day);
      break;
    case "week":
    case "weeks":
    case "w":
      numericDate = Math.round(value * week);
      break;
    default:
      numericDate = Math.round(value * year);
      break;
  }
  if (matched[1] === "-" || matched[4] === "ago") {
    return -numericDate;
  }
  return numericDate;
}
function validateInput(label, input) {
  if (!Number.isFinite(input)) {
    throw new TypeError(`Invalid ${label} input`);
  }
  return input;
}
function validateClaimsSet(protectedHeader, encodedPayload, options = {}) {
  let payload;
  try {
    payload = JSON.parse(decoder.decode(encodedPayload));
  } catch {
  }
  if (!isObject(payload)) {
    throw new JWTInvalid("JWT Claims Set must be a top-level JSON object");
  }
  const { typ } = options;
  if (typ && (typeof protectedHeader.typ !== "string" || normalizeTyp(protectedHeader.typ) !== normalizeTyp(typ))) {
    throw new JWTClaimValidationFailed('unexpected "typ" JWT header value', payload, "typ", "check_failed");
  }
  const { requiredClaims = [], issuer, subject, audience, maxTokenAge } = options;
  const presenceCheck = [...requiredClaims];
  if (maxTokenAge !== void 0)
    presenceCheck.push("iat");
  if (audience !== void 0)
    presenceCheck.push("aud");
  if (subject !== void 0)
    presenceCheck.push("sub");
  if (issuer !== void 0)
    presenceCheck.push("iss");
  for (const claim of new Set(presenceCheck.reverse())) {
    if (!(claim in payload)) {
      throw new JWTClaimValidationFailed(`missing required "${claim}" claim`, payload, claim, "missing");
    }
  }
  if (issuer && !(Array.isArray(issuer) ? issuer : [issuer]).includes(payload.iss)) {
    throw new JWTClaimValidationFailed('unexpected "iss" claim value', payload, "iss", "check_failed");
  }
  if (subject && payload.sub !== subject) {
    throw new JWTClaimValidationFailed('unexpected "sub" claim value', payload, "sub", "check_failed");
  }
  if (audience && !checkAudiencePresence(payload.aud, typeof audience === "string" ? [audience] : audience)) {
    throw new JWTClaimValidationFailed('unexpected "aud" claim value', payload, "aud", "check_failed");
  }
  let tolerance;
  switch (typeof options.clockTolerance) {
    case "string":
      tolerance = secs(options.clockTolerance);
      break;
    case "number":
      tolerance = options.clockTolerance;
      break;
    case "undefined":
      tolerance = 0;
      break;
    default:
      throw new TypeError("Invalid clockTolerance option type");
  }
  const { currentDate } = options;
  const now = epoch(currentDate || /* @__PURE__ */ new Date());
  if ((payload.iat !== void 0 || maxTokenAge) && typeof payload.iat !== "number") {
    throw new JWTClaimValidationFailed('"iat" claim must be a number', payload, "iat", "invalid");
  }
  if (payload.nbf !== void 0) {
    if (typeof payload.nbf !== "number") {
      throw new JWTClaimValidationFailed('"nbf" claim must be a number', payload, "nbf", "invalid");
    }
    if (payload.nbf > now + tolerance) {
      throw new JWTClaimValidationFailed('"nbf" claim timestamp check failed', payload, "nbf", "check_failed");
    }
  }
  if (payload.exp !== void 0) {
    if (typeof payload.exp !== "number") {
      throw new JWTClaimValidationFailed('"exp" claim must be a number', payload, "exp", "invalid");
    }
    if (payload.exp <= now - tolerance) {
      throw new JWTExpired('"exp" claim timestamp check failed', payload, "exp", "check_failed");
    }
  }
  if (maxTokenAge) {
    const age = now - payload.iat;
    const max = typeof maxTokenAge === "number" ? maxTokenAge : secs(maxTokenAge);
    if (age - tolerance > max) {
      throw new JWTExpired('"iat" claim timestamp check failed (too far in the past)', payload, "iat", "check_failed");
    }
    if (age < 0 - tolerance) {
      throw new JWTClaimValidationFailed('"iat" claim timestamp check failed (it should be in the past)', payload, "iat", "check_failed");
    }
  }
  return payload;
}
var epoch, minute, hour, day, week, year, REGEX, normalizeTyp, checkAudiencePresence, JWTClaimsBuilder;
var init_jwt_claims_set = __esm({
  "../node_modules/jose/dist/webapi/lib/jwt_claims_set.js"() {
    init_functionsRoutes_0_4727514041666032();
    init_errors2();
    init_buffer_utils();
    init_type_checks();
    epoch = /* @__PURE__ */ __name((date) => Math.floor(date.getTime() / 1e3), "epoch");
    minute = 60;
    hour = minute * 60;
    day = hour * 24;
    week = day * 7;
    year = day * 365.25;
    REGEX = /^(\+|\-)? ?(\d+|\d+\.\d+) ?(seconds?|secs?|s|minutes?|mins?|m|hours?|hrs?|h|days?|d|weeks?|w|years?|yrs?|y)(?: (ago|from now))?$/i;
    __name(secs, "secs");
    __name(validateInput, "validateInput");
    normalizeTyp = /* @__PURE__ */ __name((value) => {
      if (value.includes("/")) {
        return value.toLowerCase();
      }
      return `application/${value.toLowerCase()}`;
    }, "normalizeTyp");
    checkAudiencePresence = /* @__PURE__ */ __name((audPayload, audOption) => {
      if (typeof audPayload === "string") {
        return audOption.includes(audPayload);
      }
      if (Array.isArray(audPayload)) {
        return audOption.some(Set.prototype.has.bind(new Set(audPayload)));
      }
      return false;
    }, "checkAudiencePresence");
    __name(validateClaimsSet, "validateClaimsSet");
    JWTClaimsBuilder = class {
      static {
        __name(this, "JWTClaimsBuilder");
      }
      #payload;
      constructor(payload) {
        if (!isObject(payload)) {
          throw new TypeError("JWT Claims Set MUST be an object");
        }
        this.#payload = structuredClone(payload);
      }
      data() {
        return encoder.encode(JSON.stringify(this.#payload));
      }
      get iss() {
        return this.#payload.iss;
      }
      set iss(value) {
        this.#payload.iss = value;
      }
      get sub() {
        return this.#payload.sub;
      }
      set sub(value) {
        this.#payload.sub = value;
      }
      get aud() {
        return this.#payload.aud;
      }
      set aud(value) {
        this.#payload.aud = value;
      }
      set jti(value) {
        this.#payload.jti = value;
      }
      set nbf(value) {
        if (typeof value === "number") {
          this.#payload.nbf = validateInput("setNotBefore", value);
        } else if (value instanceof Date) {
          this.#payload.nbf = validateInput("setNotBefore", epoch(value));
        } else {
          this.#payload.nbf = epoch(/* @__PURE__ */ new Date()) + secs(value);
        }
      }
      set exp(value) {
        if (typeof value === "number") {
          this.#payload.exp = validateInput("setExpirationTime", value);
        } else if (value instanceof Date) {
          this.#payload.exp = validateInput("setExpirationTime", epoch(value));
        } else {
          this.#payload.exp = epoch(/* @__PURE__ */ new Date()) + secs(value);
        }
      }
      set iat(value) {
        if (value === void 0) {
          this.#payload.iat = epoch(/* @__PURE__ */ new Date());
        } else if (value instanceof Date) {
          this.#payload.iat = validateInput("setIssuedAt", epoch(value));
        } else if (typeof value === "string") {
          this.#payload.iat = validateInput("setIssuedAt", epoch(/* @__PURE__ */ new Date()) + secs(value));
        } else {
          this.#payload.iat = validateInput("setIssuedAt", value);
        }
      }
    };
  }
});

// ../node_modules/jose/dist/webapi/jwt/verify.js
async function jwtVerify(jwt, key, options) {
  const verified = await compactVerify(jwt, key, options);
  if (verified.protectedHeader.crit?.includes("b64") && verified.protectedHeader.b64 === false) {
    throw new JWTInvalid("JWTs MUST NOT use unencoded payload");
  }
  const payload = validateClaimsSet(verified.protectedHeader, verified.payload, options);
  const result = { payload, protectedHeader: verified.protectedHeader };
  if (typeof key === "function") {
    return { ...result, key: verified.key };
  }
  return result;
}
var init_verify3 = __esm({
  "../node_modules/jose/dist/webapi/jwt/verify.js"() {
    init_functionsRoutes_0_4727514041666032();
    init_verify2();
    init_jwt_claims_set();
    init_errors2();
    __name(jwtVerify, "jwtVerify");
  }
});

// ../node_modules/jose/dist/webapi/jws/flattened/sign.js
var FlattenedSign;
var init_sign = __esm({
  "../node_modules/jose/dist/webapi/jws/flattened/sign.js"() {
    init_functionsRoutes_0_4727514041666032();
    init_base64url();
    init_signing();
    init_type_checks();
    init_errors2();
    init_buffer_utils();
    init_check_key_type();
    init_validate_crit();
    init_normalize_key();
    init_helpers();
    FlattenedSign = class {
      static {
        __name(this, "FlattenedSign");
      }
      #payload;
      #protectedHeader;
      #unprotectedHeader;
      constructor(payload) {
        if (!(payload instanceof Uint8Array)) {
          throw new TypeError("payload must be an instance of Uint8Array");
        }
        this.#payload = payload;
      }
      setProtectedHeader(protectedHeader) {
        assertNotSet(this.#protectedHeader, "setProtectedHeader");
        this.#protectedHeader = protectedHeader;
        return this;
      }
      setUnprotectedHeader(unprotectedHeader) {
        assertNotSet(this.#unprotectedHeader, "setUnprotectedHeader");
        this.#unprotectedHeader = unprotectedHeader;
        return this;
      }
      async sign(key, options) {
        if (!this.#protectedHeader && !this.#unprotectedHeader) {
          throw new JWSInvalid("either setProtectedHeader or setUnprotectedHeader must be called before #sign()");
        }
        if (!isDisjoint(this.#protectedHeader, this.#unprotectedHeader)) {
          throw new JWSInvalid("JWS Protected and JWS Unprotected Header Parameter names must be disjoint");
        }
        const joseHeader = {
          ...this.#protectedHeader,
          ...this.#unprotectedHeader
        };
        const extensions = validateCrit(JWSInvalid, /* @__PURE__ */ new Map([["b64", true]]), options?.crit, this.#protectedHeader, joseHeader);
        let b64 = true;
        if (extensions.has("b64")) {
          b64 = this.#protectedHeader.b64;
          if (typeof b64 !== "boolean") {
            throw new JWSInvalid('The "b64" (base64url-encode payload) Header Parameter must be a boolean');
          }
        }
        const { alg } = joseHeader;
        if (typeof alg !== "string" || !alg) {
          throw new JWSInvalid('JWS "alg" (Algorithm) Header Parameter missing or invalid');
        }
        checkKeyType(alg, key, "sign");
        let payloadS;
        let payloadB;
        if (b64) {
          payloadS = encode2(this.#payload);
          payloadB = encode(payloadS);
        } else {
          payloadB = this.#payload;
          payloadS = "";
        }
        let protectedHeaderString;
        let protectedHeaderBytes;
        if (this.#protectedHeader) {
          protectedHeaderString = encode2(JSON.stringify(this.#protectedHeader));
          protectedHeaderBytes = encode(protectedHeaderString);
        } else {
          protectedHeaderString = "";
          protectedHeaderBytes = new Uint8Array();
        }
        const data = concat(protectedHeaderBytes, encode("."), payloadB);
        const k = await normalizeKey(key, alg);
        const signature = await sign(alg, k, data);
        const jws = {
          signature: encode2(signature),
          payload: payloadS
        };
        if (this.#unprotectedHeader) {
          jws.header = this.#unprotectedHeader;
        }
        if (this.#protectedHeader) {
          jws.protected = protectedHeaderString;
        }
        return jws;
      }
    };
  }
});

// ../node_modules/jose/dist/webapi/jws/compact/sign.js
var CompactSign;
var init_sign2 = __esm({
  "../node_modules/jose/dist/webapi/jws/compact/sign.js"() {
    init_functionsRoutes_0_4727514041666032();
    init_sign();
    CompactSign = class {
      static {
        __name(this, "CompactSign");
      }
      #flattened;
      constructor(payload) {
        this.#flattened = new FlattenedSign(payload);
      }
      setProtectedHeader(protectedHeader) {
        this.#flattened.setProtectedHeader(protectedHeader);
        return this;
      }
      async sign(key, options) {
        const jws = await this.#flattened.sign(key, options);
        if (jws.payload === void 0) {
          throw new TypeError("use the flattened module for creating JWS with b64: false");
        }
        return `${jws.protected}.${jws.payload}.${jws.signature}`;
      }
    };
  }
});

// ../node_modules/jose/dist/webapi/jwt/sign.js
var SignJWT;
var init_sign3 = __esm({
  "../node_modules/jose/dist/webapi/jwt/sign.js"() {
    init_functionsRoutes_0_4727514041666032();
    init_sign2();
    init_errors2();
    init_jwt_claims_set();
    SignJWT = class {
      static {
        __name(this, "SignJWT");
      }
      #protectedHeader;
      #jwt;
      constructor(payload = {}) {
        this.#jwt = new JWTClaimsBuilder(payload);
      }
      setIssuer(issuer) {
        this.#jwt.iss = issuer;
        return this;
      }
      setSubject(subject) {
        this.#jwt.sub = subject;
        return this;
      }
      setAudience(audience) {
        this.#jwt.aud = audience;
        return this;
      }
      setJti(jwtId) {
        this.#jwt.jti = jwtId;
        return this;
      }
      setNotBefore(input) {
        this.#jwt.nbf = input;
        return this;
      }
      setExpirationTime(input) {
        this.#jwt.exp = input;
        return this;
      }
      setIssuedAt(input) {
        this.#jwt.iat = input;
        return this;
      }
      setProtectedHeader(protectedHeader) {
        this.#protectedHeader = protectedHeader;
        return this;
      }
      async sign(key, options) {
        const sig = new CompactSign(this.#jwt.data());
        sig.setProtectedHeader(this.#protectedHeader);
        if (Array.isArray(this.#protectedHeader?.crit) && this.#protectedHeader.crit.includes("b64") && this.#protectedHeader.b64 === false) {
          throw new JWTInvalid("JWTs MUST NOT use unencoded payload");
        }
        return sig.sign(key, options);
      }
    };
  }
});

// ../node_modules/jose/dist/webapi/index.js
var init_webapi = __esm({
  "../node_modules/jose/dist/webapi/index.js"() {
    init_functionsRoutes_0_4727514041666032();
    init_verify3();
    init_sign3();
  }
});

// api/_middleware_auth.js
async function verifyJWT(request, env) {
  const authHeader = request.headers.get("Authorization");
  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    return null;
  }
  const token = authHeader.split(" ")[1];
  try {
    if (!env.JWT_SECRET) {
      throw new Error("CRITICAL: JWT_SECRET environment variable is not configured");
    }
    const secret = new TextEncoder().encode(env.JWT_SECRET);
    const { payload } = await jwtVerify(token, secret, {
      algorithms: ["HS256"],
      issuer: "moshly",
      audience: "moshly-api"
    });
    return payload;
  } catch (err) {
    console.error("JWT verification failed:", err.message);
    return null;
  }
}
var init_middleware_auth = __esm({
  "api/_middleware_auth.js"() {
    init_functionsRoutes_0_4727514041666032();
    init_webapi();
    __name(verifyJWT, "verifyJWT");
  }
});

// api/_cors.js
function getAllowedOrigin(request) {
  const origin = request?.headers?.get("Origin") || "";
  return ALLOWED_ORIGINS.includes(origin) ? origin : "https://moshly.io";
}
function corsOptionsResponse(request, methods = "POST, OPTIONS") {
  return new Response(null, {
    status: 204,
    headers: {
      "Access-Control-Allow-Origin": getAllowedOrigin(request),
      "Access-Control-Allow-Methods": methods,
      "Access-Control-Allow-Headers": "Content-Type, Authorization"
    }
  });
}
var ALLOWED_ORIGINS;
var init_cors = __esm({
  "api/_cors.js"() {
    init_functionsRoutes_0_4727514041666032();
    ALLOWED_ORIGINS = ["https://moshly.io", "http://localhost:8788"];
    __name(getAllowedOrigin, "getAllowedOrigin");
    __name(corsOptionsResponse, "corsOptionsResponse");
  }
});

// api/admin/invite-codes/[code].js
function json(data, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: { "Content-Type": "application/json" }
  });
}
async function onRequestDelete({ request, env, params }) {
  const payload = await verifyJWT(request, env);
  if (!payload || payload.role !== "god") {
    return json({ error: "Forbidden" }, 403);
  }
  const code = (params.code || "").toUpperCase().trim();
  if (!code) {
    return json({ error: "Code is required" }, 400);
  }
  const db = drizzle(env.MOSHLY_DB);
  try {
    const existing = await db.select({ code: inviteCodes.code }).from(inviteCodes).where(eq(inviteCodes.code, code)).get();
    if (!existing) {
      return json({ error: "Code not found" }, 404);
    }
    await db.delete(inviteCodes).where(eq(inviteCodes.code, code));
    console.info("Invite code revoked", { code, revokedBy: payload.userId });
    return json({ success: true, message: `Code ${code} revoked.` });
  } catch (err) {
    console.error("Failed to revoke invite code:", { error: err.message, code });
    return json({ error: "Failed to revoke code" }, 500);
  }
}
async function onRequestOptions({ request }) {
  return new Response(null, {
    status: 204,
    headers: {
      "Access-Control-Allow-Origin": getAllowedOrigin(request),
      "Access-Control-Allow-Methods": "DELETE, OPTIONS",
      "Access-Control-Allow-Headers": "Content-Type, Authorization"
    }
  });
}
var init_code = __esm({
  "api/admin/invite-codes/[code].js"() {
    init_functionsRoutes_0_4727514041666032();
    init_d1();
    init_drizzle_orm();
    init_schema();
    init_middleware_auth();
    init_cors();
    __name(json, "json");
    __name(onRequestDelete, "onRequestDelete");
    __name(onRequestOptions, "onRequestOptions");
  }
});

// api/admin/invite-codes.js
function json2(data, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: { "Content-Type": "application/json" }
  });
}
function requireGod(payload) {
  return payload?.role === "god";
}
function generateCode(custom) {
  if (custom) return custom.toUpperCase().trim();
  const chars = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
  const randomBytes2 = crypto.getRandomValues(new Uint8Array(CODE_SUFFIX_LENGTH));
  const suffix = Array.from(randomBytes2, (b) => chars[b % chars.length]).join("");
  return `${CODE_PREFIX}${suffix}`;
}
function computeSubscriptionExpiresAt(durationMonths) {
  if (durationMonths === 0) return null;
  const date = /* @__PURE__ */ new Date();
  date.setMonth(date.getMonth() + durationMonths);
  return date;
}
async function onRequestGet({ request, env }) {
  const payload = await verifyJWT(request, env);
  if (!payload || !requireGod(payload)) {
    return json2({ error: "Forbidden" }, 403);
  }
  const db = drizzle(env.MOSHLY_DB);
  try {
    const codes = await db.select().from(inviteCodes).orderBy(desc(inviteCodes.createdAt)).all();
    return json2({
      success: true,
      codes: codes.map((c) => ({
        code: c.code,
        plan: c.plan,
        months: c.durationMonths,
        max_uses: c.maxUses,
        uses_count: c.usesCount,
        expires_at: c.expiresAt ? c.expiresAt.toISOString() : null,
        note: c.note,
        created_at: c.createdAt ? c.createdAt.toISOString() : null
      }))
    });
  } catch (err) {
    console.error("Failed to list invite codes:", { error: err.message });
    return json2({ error: "Failed to load invite codes" }, 500);
  }
}
async function onRequestPost({ request, env }) {
  const payload = await verifyJWT(request, env);
  if (!payload || !requireGod(payload)) {
    return json2({ error: "Forbidden" }, 403);
  }
  let body;
  try {
    body = await request.json();
  } catch {
    return json2({ error: "Invalid JSON body" }, 400);
  }
  const { plan, months, max_uses, note, code: customCode } = body;
  if (!ALLOWED_PLANS.includes(plan)) {
    return json2({ error: `Invalid plan. Must be one of: ${ALLOWED_PLANS.join(", ")}` }, 400);
  }
  if (!ALLOWED_DURATIONS.includes(Number(months))) {
    return json2({ error: "Invalid duration. Allowed: 0 (eternal), 3, 6, 12 months" }, 400);
  }
  const durationMonths = Number(months);
  const maxUses = Math.max(1, Math.min(9999, parseInt(max_uses) || 1));
  const db = drizzle(env.MOSHLY_DB);
  const godWorkspace = await db.select({ id: workspaces.id }).from(workspaces).where(eq(workspaces.ownerId, payload.userId)).get();
  if (!godWorkspace) {
    return json2({ error: "God user workspace not found" }, 500);
  }
  const code = generateCode(customCode);
  const codeExpiresAt = durationMonths === 0 ? null : computeSubscriptionExpiresAt(12);
  try {
    await db.insert(inviteCodes).values({
      code,
      workspaceId: godWorkspace.id,
      plan,
      durationMonths,
      maxUses,
      usesCount: 0,
      expiresAt: codeExpiresAt,
      note: note || null
    });
    console.info("Invite code created", { code, plan, durationMonths, maxUses, createdBy: payload.userId });
    return json2({
      success: true,
      code: {
        code,
        plan,
        months: durationMonths,
        max_uses: maxUses,
        uses_count: 0,
        expires_at: codeExpiresAt ? codeExpiresAt.toISOString() : null,
        note: note || null
      }
    }, 201);
  } catch (err) {
    if (err.message?.includes("UNIQUE")) {
      return json2({ error: "Code already exists. Try a different custom code or leave it blank." }, 409);
    }
    console.error("Failed to create invite code:", { error: err.message, code });
    return json2({ error: "Failed to create invite code" }, 500);
  }
}
async function onRequestOptions2({ request }) {
  return new Response(null, {
    status: 204,
    headers: {
      "Access-Control-Allow-Origin": getAllowedOrigin(request),
      "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
      "Access-Control-Allow-Headers": "Content-Type, Authorization"
    }
  });
}
var ALLOWED_PLANS, ALLOWED_DURATIONS, CODE_PREFIX, CODE_SUFFIX_LENGTH;
var init_invite_codes = __esm({
  "api/admin/invite-codes.js"() {
    init_functionsRoutes_0_4727514041666032();
    init_d1();
    init_drizzle_orm();
    init_schema();
    init_middleware_auth();
    init_cors();
    ALLOWED_PLANS = ["free", "solo", "collective", "business", "major", "semi_god", "god"];
    ALLOWED_DURATIONS = [0, 3, 6, 12];
    CODE_PREFIX = "MOSH-";
    CODE_SUFFIX_LENGTH = 6;
    __name(json2, "json");
    __name(requireGod, "requireGod");
    __name(generateCode, "generateCode");
    __name(computeSubscriptionExpiresAt, "computeSubscriptionExpiresAt");
    __name(onRequestGet, "onRequestGet");
    __name(onRequestPost, "onRequestPost");
    __name(onRequestOptions2, "onRequestOptions");
  }
});

// api/_rate-limit.js
function getClientIp(request) {
  return request.headers.get("CF-Connecting-IP") || request.headers.get("X-Forwarded-For")?.split(",")[0].trim() || "unknown";
}
async function applyRateLimit(kv, endpoint, identifier) {
  if (!kv) return null;
  const maxAttempts = MAX_ATTEMPTS_PER_WINDOW[endpoint] ?? 10;
  const now = Math.floor(Date.now() / 1e3);
  const key = `rl:${endpoint}:${identifier}`;
  const raw = await kv.get(key);
  const state = raw ? JSON.parse(raw) : { count: 0, windowStart: now };
  if (now - state.windowStart >= WINDOW_SECONDS) {
    state.count = 0;
    state.windowStart = now;
  }
  state.count += 1;
  await kv.put(key, JSON.stringify(state), {
    expirationTtl: WINDOW_SECONDS + 60
  });
  if (state.count > maxAttempts) {
    const retryAfter = state.windowStart + WINDOW_SECONDS - now;
    return retryAfter > 0 ? retryAfter : 1;
  }
  return null;
}
function rateLimitedResponse(retryAfter) {
  return new Response(
    JSON.stringify({ error: "Too many requests. Please try again later." }),
    {
      status: 429,
      headers: {
        "Content-Type": "application/json",
        "Retry-After": String(retryAfter)
      }
    }
  );
}
var WINDOW_SECONDS, MAX_ATTEMPTS_PER_WINDOW;
var init_rate_limit = __esm({
  "api/_rate-limit.js"() {
    init_functionsRoutes_0_4727514041666032();
    WINDOW_SECONDS = 900;
    MAX_ATTEMPTS_PER_WINDOW = {
      login: 10,
      register: 5,
      "forgot-password": 5,
      "reset-password": 5,
      refresh: 20,
      "me-patch": 30
    };
    __name(getClientIp, "getClientIp");
    __name(applyRateLimit, "applyRateLimit");
    __name(rateLimitedResponse, "rateLimitedResponse");
  }
});

// api/contact.js
function json3(data, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: { "Content-Type": "application/json" }
  });
}
function isValidEmail(email) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(String(email || "").trim());
}
function esc(str) {
  return String(str || "").replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");
}
async function sendViaResend(apiKey, payload) {
  const response = await fetch(RESEND_API, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json"
    },
    body: JSON.stringify(payload)
  });
  const result = await response.json().catch(() => ({}));
  if (!response.ok) {
    throw new Error(result.message || result.error || `Resend error ${response.status}`);
  }
  return result;
}
function buildUserConfirmationHtml(name, subject, message2, origin) {
  const logoUrl = `${origin}/assets/Moshly-Main-Logo-1.svg`;
  return `
    <div style="margin:0;padding:32px 16px;background-color:#0E0F14;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Helvetica,Arial,sans-serif;">
      <div style="max-width:600px;margin:0 auto;background:#1B1E2E;border:1px solid #2D3048;border-radius:16px;overflow:hidden;box-shadow: 0 10px 25px -5px rgba(0, 0, 0, 0.3);">
        <div style="padding:32px;text-align:center;border-bottom:1px solid #2D3048;background:#141624;">
          <img src="${logoUrl}" alt="Moshly" style="height:32px;margin-bottom:12px;" />
        </div>
        <div style="padding:40px 32px;">
          <div style="font-size:12px;letter-spacing:0.15em;text-transform:uppercase;color:#7B7F93;margin-bottom:12px;text-align:center;">Contact Request</div>
          <h2 style="margin:0 0 16px;font-size:24px;font-weight:700;color:#E6E7EB;line-height:1.3;text-align:center;">We got your message.</h2>
          <p style="margin:0 0 24px;font-size:16px;color:#A4A7B5;line-height:1.7;text-align:center;">
            Hi ${esc(name)}, thanks for reaching out. We've received your message and will get back to you shortly.
          </p>
          <div style="background:#141624;border:1px solid #24273A;border-radius:12px;padding:24px;margin:32px 0;">
            <div style="font-size:11px;letter-spacing:0.1em;text-transform:uppercase;color:#7B7F93;margin-bottom:10px;">Your message</div>
            <div style="font-size:15px;color:#A4A7B5;font-weight:600;margin-bottom:8px;">${esc(subject)}</div>
            <div style="font-size:14px;color:#E6E7EB;line-height:1.6;white-space:pre-wrap;">${esc(message2)}</div>
          </div>
          <p style="margin:0;font-size:14px;color:#7B7F93;line-height:1.7;text-align:center;">
            We reply fast \u2014 usually within a business day.<br/>
            In the meantime, feel free to explore <a href="${origin}/pricing" style="color:#6B5CFF;text-decoration:none;">our plans</a>.
          </p>
        </div>
        <div style="padding:24px 32px;border-top:1px solid #2D3048;background:#141624;text-align:center;">
          <p style="margin:0;font-size:12px;color:#7B7F93;letter-spacing:0.02em;">
            \xA9 2026 Moshly \xB7 <a href="${origin}" style="color:#6B5CFF;text-decoration:none;">moshly.io</a>
          </p>
        </div>
      </div>
    </div>
  `;
}
function buildTeamNotificationHtml(name, email, subject, message2) {
  return `
    <div style="font-family:Arial,sans-serif;line-height:1.6;color:#111827;padding:24px;">
      <h2 style="margin:0 0 16px;">New contact form submission</h2>
      <table style="border-collapse:collapse;width:100%;">
        <tr><td style="padding:6px 0;font-weight:600;width:80px;">Name</td><td>${esc(name)}</td></tr>
        <tr><td style="padding:6px 0;font-weight:600;">Email</td><td>${esc(email)}</td></tr>
        <tr><td style="padding:6px 0;font-weight:600;">Subject</td><td>${esc(subject)}</td></tr>
        <tr><td style="padding:6px 0;font-weight:600;vertical-align:top;">Message</td><td style="white-space:pre-wrap;">${esc(message2)}</td></tr>
        <tr><td style="padding:6px 0;font-weight:600;">Time</td><td>${(/* @__PURE__ */ new Date()).toISOString()}</td></tr>
      </table>
    </div>
  `;
}
async function onRequestPost2({ request, env }) {
  const clientIp = getClientIp(request);
  const retryAfter = await applyRateLimit(env.AUTH_KV, "forgot-password", `contact:${clientIp}`);
  if (retryAfter) return rateLimitedResponse(retryAfter);
  let body;
  try {
    body = await request.json();
  } catch {
    return json3({ error: "Invalid request body" }, 400);
  }
  const name = String(body.name || "").trim().slice(0, MAX_NAME_LENGTH);
  const email = String(body.email || "").trim().toLowerCase();
  const subject = String(body.subject || "").trim();
  const message2 = String(body.message || "").trim().slice(0, MAX_MESSAGE_LENGTH);
  if (!name) return json3({ error: "Name is required" }, 400);
  if (!isValidEmail(email)) return json3({ error: "A valid email is required" }, 400);
  if (!ALLOWED_SUBJECTS.includes(subject)) return json3({ error: "Invalid subject" }, 400);
  if (!message2 || message2.length < 10) return json3({ error: "Message must be at least 10 characters" }, 400);
  const apiKey = env.RESEND_API_KEY;
  const fromEmail = env.RESEND_FROM_EMAIL || "noreply@moshly.io";
  const notifyTo = env.CONTACT_NOTIFY_TO || "hello@moshly.io";
  const origin = new URL(request.url).origin;
  if (!apiKey) {
    console.error("Contact form failed: RESEND_API_KEY not configured");
    return json3({ error: "Email service is not configured" }, 500);
  }
  try {
    await Promise.all([
      sendViaResend(apiKey, {
        from: `Moshly <${fromEmail}>`,
        to: [email],
        subject: "We got your message \u2014 Moshly",
        html: buildUserConfirmationHtml(name, subject, message2, origin),
        text: `Hi ${name},

Thanks for reaching out. We've received your message and will get back to you shortly.

Your message:
${subject}
${message2}

\xA9 2026 Moshly \xB7 moshly.io`
      }),
      sendViaResend(apiKey, {
        from: `Moshly Contact <${fromEmail}>`,
        to: [notifyTo],
        reply_to: email,
        subject: `Contact: ${subject} \u2014 ${name}`,
        html: buildTeamNotificationHtml(name, email, subject, message2),
        text: `New contact
Name: ${name}
Email: ${email}
Subject: ${subject}
Message: ${message2}
Time: ${(/* @__PURE__ */ new Date()).toISOString()}`
      })
    ]);
    console.info("Contact form submitted", { name, email: "[redacted]", subject });
    return json3({ success: true });
  } catch (err) {
    console.error("Contact form email failed:", { error: err.message });
    return json3({ error: "Failed to send message. Please try again." }, 500);
  }
}
async function onRequestOptions3({ request }) {
  return new Response(null, {
    status: 204,
    headers: {
      "Access-Control-Allow-Origin": getAllowedOrigin(request),
      "Access-Control-Allow-Methods": "POST, OPTIONS",
      "Access-Control-Allow-Headers": "Content-Type"
    }
  });
}
var RESEND_API, MAX_MESSAGE_LENGTH, MAX_NAME_LENGTH, ALLOWED_SUBJECTS;
var init_contact = __esm({
  "api/contact.js"() {
    init_functionsRoutes_0_4727514041666032();
    init_rate_limit();
    init_cors();
    RESEND_API = "https://api.resend.com/emails";
    MAX_MESSAGE_LENGTH = 2e3;
    MAX_NAME_LENGTH = 100;
    ALLOWED_SUBJECTS = [
      "Plan question",
      "Custom deal",
      "Technical support",
      "Partnership",
      "Other"
    ];
    __name(json3, "json");
    __name(isValidEmail, "isValidEmail");
    __name(esc, "esc");
    __name(sendViaResend, "sendViaResend");
    __name(buildUserConfirmationHtml, "buildUserConfirmationHtml");
    __name(buildTeamNotificationHtml, "buildTeamNotificationHtml");
    __name(onRequestPost2, "onRequestPost");
    __name(onRequestOptions3, "onRequestOptions");
  }
});

// api/forgot-password.js
async function sha256Hex(input) {
  const buffer = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(input));
  return Array.from(new Uint8Array(buffer)).map((b) => b.toString(16).padStart(2, "0")).join("");
}
async function onRequestPost3({ request, env }) {
  const db = drizzle(env.MOSHLY_DB);
  try {
    const clientIp = getClientIp(request);
    const ipRetryAfter = await applyRateLimit(env.AUTH_KV, "forgot-password", `ip:${clientIp}`);
    if (ipRetryAfter) return rateLimitedResponse(ipRetryAfter);
    let email;
    try {
      ({ email } = await request.json());
    } catch {
      return new Response(JSON.stringify({ error: "Invalid request body" }), {
        status: 400,
        headers: { "Content-Type": "application/json" }
      });
    }
    if (!email) {
      return new Response(JSON.stringify({ error: "Email is required" }), {
        status: 400,
        headers: { "Content-Type": "application/json" }
      });
    }
    const emailRetryAfter = await applyRateLimit(env.AUTH_KV, "forgot-password", `email:${email.toLowerCase()}`);
    if (emailRetryAfter) return rateLimitedResponse(emailRetryAfter);
    const user = await db.select({
      id: users.id,
      emailVerified: users.emailVerified
    }).from(users).where(eq(users.email, email)).get();
    if (!user || !user.emailVerified) {
      return new Response(JSON.stringify({
        success: true,
        message: "If an account exists with that email, a reset link has been sent."
      }), {
        status: 200,
        headers: { "Content-Type": "application/json" }
      });
    }
    const resetToken = crypto.randomUUID();
    const resetTokenHash = await sha256Hex(resetToken);
    const expiresAt = new Date(Date.now() + 36e5);
    await db.update(users).set({
      resetToken: resetTokenHash,
      resetExpires: expiresAt
    }).where(eq(users.id, user.id)).run();
    const apiKey = env.RESEND_API_KEY;
    const fromEmail = env.RESEND_FROM_EMAIL || "Moshly <auth@moshly.io>";
    if (apiKey) {
      const origin = new URL(request.url).origin;
      const resetLink = `${origin}/reset-password.html?token=${resetToken}`;
      const logoUrl = `${origin}/assets/Moshly-Main-Logo-1.svg`;
      await fetch(`${RESEND_API_BASE}/emails`, {
        method: "POST",
        headers: {
          "Authorization": `Bearer ${apiKey}`,
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          from: fromEmail,
          to: [email],
          subject: "Reset your Moshly password",
          html: `
            <div style="margin:0;padding:32px 16px;background-color:#0E0F14;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Helvetica,Arial,sans-serif;">
              <div style="max-width:600px;margin:0 auto;background:#1B1E2E;border:1px solid #2D3048;border-radius:16px;overflow:hidden;box-shadow: 0 10px 25px -5px rgba(0, 0, 0, 0.3);">
                <div style="padding:32px;text-align:center;border-bottom:1px solid #2D3048;background:#141624;">
                  <img src="${logoUrl}" alt="Moshly" style="height:32px;margin-bottom:12px;" />
                </div>
                <div style="padding:40px 32px;">
                  <h2 style="margin:0 0 16px;font-size:24px;font-weight:700;color:#E6E7EB;line-height:1.3;text-align:center;">Password Reset Request</h2>
                  <p style="margin:0 0 24px;font-size:16px;color:#A4A7B5;line-height:1.7;text-align:center;">
                    We received a request to reset your Moshly password. Click the button below to choose a new one:
                  </p>
                  <div style="text-align:center;margin:32px 0;">
                    <a href="${resetLink}" style="display:inline-block;background-color:#6B5CFF;color:#FFFFFF;padding:14px 28px;text-decoration:none;border-radius:10px;font-weight:700;font-size:16px;box-shadow: 0 4px 12px rgba(107, 92, 255, 0.3);">Reset Password</a>
                  </div>
                  <p style="margin:24px 0 0;font-size:14px;color:#7B7F93;line-height:1.6;text-align:center;">
                    This link will expire in 1 hour.<br/>
                    If you didn't request this, you can safely ignore this email.
                  </p>
                </div>
                <div style="padding:24px 32px;border-top:1px solid #2D3048;background:#141624;text-align:center;">
                  <p style="margin:0;font-size:12px;color:#7B7F93;letter-spacing:0.02em;">
                    \xA9 2026 Moshly \xB7 <a href="${origin}" style="color:#6B5CFF;text-decoration:none;">moshly.io</a>
                  </p>
                </div>
              </div>
            </div>
          `,
          text: `Reset your Moshly password by visiting this link: ${resetLink}

This link will expire in 1 hour.

\xA9 2026 Moshly \xB7 moshly.io`
        })
      });
    } else {
      console.warn("RESEND_API_KEY not found, email not sent");
    }
    return new Response(JSON.stringify({
      success: true,
      message: "If an account exists with that email, a reset link has been sent."
    }), {
      status: 200,
      headers: { "Content-Type": "application/json" }
    });
  } catch (error) {
    console.error("Forgot password error:", error);
    return new Response(JSON.stringify({ error: "Server error" }), {
      status: 500,
      headers: { "Content-Type": "application/json" }
    });
  }
}
var RESEND_API_BASE, onRequestOptions4;
var init_forgot_password = __esm({
  "api/forgot-password.js"() {
    init_functionsRoutes_0_4727514041666032();
    init_d1();
    init_schema();
    init_drizzle_orm();
    init_rate_limit();
    init_cors();
    RESEND_API_BASE = "https://api.resend.com";
    __name(sha256Hex, "sha256Hex");
    __name(onRequestPost3, "onRequestPost");
    onRequestOptions4 = /* @__PURE__ */ __name(({ request }) => corsOptionsResponse(request, "POST, OPTIONS"), "onRequestOptions");
  }
});

// (disabled):crypto
var require_crypto = __commonJS({
  "(disabled):crypto"() {
    init_functionsRoutes_0_4727514041666032();
  }
});

// ../node_modules/bcryptjs/index.js
function randomBytes(len) {
  try {
    return crypto.getRandomValues(new Uint8Array(len));
  } catch {
  }
  try {
    return import_crypto.default.randomBytes(len);
  } catch {
  }
  if (!randomFallback) {
    throw Error(
      "Neither WebCryptoAPI nor a crypto module is available. Use bcrypt.setRandomFallback to set an alternative"
    );
  }
  return randomFallback(len);
}
function setRandomFallback(random) {
  randomFallback = random;
}
function genSaltSync(rounds, seed_length) {
  rounds = rounds || GENSALT_DEFAULT_LOG2_ROUNDS;
  if (typeof rounds !== "number")
    throw Error(
      "Illegal arguments: " + typeof rounds + ", " + typeof seed_length
    );
  if (rounds < 4) rounds = 4;
  else if (rounds > 31) rounds = 31;
  var salt = [];
  salt.push("$2b$");
  if (rounds < 10) salt.push("0");
  salt.push(rounds.toString());
  salt.push("$");
  salt.push(base64_encode(randomBytes(BCRYPT_SALT_LEN), BCRYPT_SALT_LEN));
  return salt.join("");
}
function genSalt(rounds, seed_length, callback) {
  if (typeof seed_length === "function")
    callback = seed_length, seed_length = void 0;
  if (typeof rounds === "function") callback = rounds, rounds = void 0;
  if (typeof rounds === "undefined") rounds = GENSALT_DEFAULT_LOG2_ROUNDS;
  else if (typeof rounds !== "number")
    throw Error("illegal arguments: " + typeof rounds);
  function _async(callback2) {
    nextTick(function() {
      try {
        callback2(null, genSaltSync(rounds));
      } catch (err) {
        callback2(err);
      }
    });
  }
  __name(_async, "_async");
  if (callback) {
    if (typeof callback !== "function")
      throw Error("Illegal callback: " + typeof callback);
    _async(callback);
  } else
    return new Promise(function(resolve, reject) {
      _async(function(err, res) {
        if (err) {
          reject(err);
          return;
        }
        resolve(res);
      });
    });
}
function hashSync(password, salt) {
  if (typeof salt === "undefined") salt = GENSALT_DEFAULT_LOG2_ROUNDS;
  if (typeof salt === "number") salt = genSaltSync(salt);
  if (typeof password !== "string" || typeof salt !== "string")
    throw Error("Illegal arguments: " + typeof password + ", " + typeof salt);
  return _hash(password, salt);
}
function hash(password, salt, callback, progressCallback) {
  function _async(callback2) {
    if (typeof password === "string" && typeof salt === "number")
      genSalt(salt, function(err, salt2) {
        _hash(password, salt2, callback2, progressCallback);
      });
    else if (typeof password === "string" && typeof salt === "string")
      _hash(password, salt, callback2, progressCallback);
    else
      nextTick(
        callback2.bind(
          this,
          Error("Illegal arguments: " + typeof password + ", " + typeof salt)
        )
      );
  }
  __name(_async, "_async");
  if (callback) {
    if (typeof callback !== "function")
      throw Error("Illegal callback: " + typeof callback);
    _async(callback);
  } else
    return new Promise(function(resolve, reject) {
      _async(function(err, res) {
        if (err) {
          reject(err);
          return;
        }
        resolve(res);
      });
    });
}
function safeStringCompare(known, unknown) {
  var diff = known.length ^ unknown.length;
  for (var i = 0; i < known.length; ++i) {
    diff |= known.charCodeAt(i) ^ unknown.charCodeAt(i);
  }
  return diff === 0;
}
function compareSync(password, hash2) {
  if (typeof password !== "string" || typeof hash2 !== "string")
    throw Error("Illegal arguments: " + typeof password + ", " + typeof hash2);
  if (hash2.length !== 60) return false;
  return safeStringCompare(
    hashSync(password, hash2.substring(0, hash2.length - 31)),
    hash2
  );
}
function compare(password, hashValue, callback, progressCallback) {
  function _async(callback2) {
    if (typeof password !== "string" || typeof hashValue !== "string") {
      nextTick(
        callback2.bind(
          this,
          Error(
            "Illegal arguments: " + typeof password + ", " + typeof hashValue
          )
        )
      );
      return;
    }
    if (hashValue.length !== 60) {
      nextTick(callback2.bind(this, null, false));
      return;
    }
    hash(
      password,
      hashValue.substring(0, 29),
      function(err, comp) {
        if (err) callback2(err);
        else callback2(null, safeStringCompare(comp, hashValue));
      },
      progressCallback
    );
  }
  __name(_async, "_async");
  if (callback) {
    if (typeof callback !== "function")
      throw Error("Illegal callback: " + typeof callback);
    _async(callback);
  } else
    return new Promise(function(resolve, reject) {
      _async(function(err, res) {
        if (err) {
          reject(err);
          return;
        }
        resolve(res);
      });
    });
}
function getRounds(hash2) {
  if (typeof hash2 !== "string")
    throw Error("Illegal arguments: " + typeof hash2);
  return parseInt(hash2.split("$")[2], 10);
}
function getSalt(hash2) {
  if (typeof hash2 !== "string")
    throw Error("Illegal arguments: " + typeof hash2);
  if (hash2.length !== 60)
    throw Error("Illegal hash length: " + hash2.length + " != 60");
  return hash2.substring(0, 29);
}
function truncates(password) {
  if (typeof password !== "string")
    throw Error("Illegal arguments: " + typeof password);
  return utf8Length(password) > 72;
}
function utf8Length(string) {
  var len = 0, c = 0;
  for (var i = 0; i < string.length; ++i) {
    c = string.charCodeAt(i);
    if (c < 128) len += 1;
    else if (c < 2048) len += 2;
    else if ((c & 64512) === 55296 && (string.charCodeAt(i + 1) & 64512) === 56320) {
      ++i;
      len += 4;
    } else len += 3;
  }
  return len;
}
function utf8Array(string) {
  var offset = 0, c1, c2;
  var buffer = new Array(utf8Length(string));
  for (var i = 0, k = string.length; i < k; ++i) {
    c1 = string.charCodeAt(i);
    if (c1 < 128) {
      buffer[offset++] = c1;
    } else if (c1 < 2048) {
      buffer[offset++] = c1 >> 6 | 192;
      buffer[offset++] = c1 & 63 | 128;
    } else if ((c1 & 64512) === 55296 && ((c2 = string.charCodeAt(i + 1)) & 64512) === 56320) {
      c1 = 65536 + ((c1 & 1023) << 10) + (c2 & 1023);
      ++i;
      buffer[offset++] = c1 >> 18 | 240;
      buffer[offset++] = c1 >> 12 & 63 | 128;
      buffer[offset++] = c1 >> 6 & 63 | 128;
      buffer[offset++] = c1 & 63 | 128;
    } else {
      buffer[offset++] = c1 >> 12 | 224;
      buffer[offset++] = c1 >> 6 & 63 | 128;
      buffer[offset++] = c1 & 63 | 128;
    }
  }
  return buffer;
}
function base64_encode(b, len) {
  var off = 0, rs = [], c1, c2;
  if (len <= 0 || len > b.length) throw Error("Illegal len: " + len);
  while (off < len) {
    c1 = b[off++] & 255;
    rs.push(BASE64_CODE[c1 >> 2 & 63]);
    c1 = (c1 & 3) << 4;
    if (off >= len) {
      rs.push(BASE64_CODE[c1 & 63]);
      break;
    }
    c2 = b[off++] & 255;
    c1 |= c2 >> 4 & 15;
    rs.push(BASE64_CODE[c1 & 63]);
    c1 = (c2 & 15) << 2;
    if (off >= len) {
      rs.push(BASE64_CODE[c1 & 63]);
      break;
    }
    c2 = b[off++] & 255;
    c1 |= c2 >> 6 & 3;
    rs.push(BASE64_CODE[c1 & 63]);
    rs.push(BASE64_CODE[c2 & 63]);
  }
  return rs.join("");
}
function base64_decode(s, len) {
  var off = 0, slen = s.length, olen = 0, rs = [], c1, c2, c3, c4, o, code;
  if (len <= 0) throw Error("Illegal len: " + len);
  while (off < slen - 1 && olen < len) {
    code = s.charCodeAt(off++);
    c1 = code < BASE64_INDEX.length ? BASE64_INDEX[code] : -1;
    code = s.charCodeAt(off++);
    c2 = code < BASE64_INDEX.length ? BASE64_INDEX[code] : -1;
    if (c1 == -1 || c2 == -1) break;
    o = c1 << 2 >>> 0;
    o |= (c2 & 48) >> 4;
    rs.push(String.fromCharCode(o));
    if (++olen >= len || off >= slen) break;
    code = s.charCodeAt(off++);
    c3 = code < BASE64_INDEX.length ? BASE64_INDEX[code] : -1;
    if (c3 == -1) break;
    o = (c2 & 15) << 4 >>> 0;
    o |= (c3 & 60) >> 2;
    rs.push(String.fromCharCode(o));
    if (++olen >= len || off >= slen) break;
    code = s.charCodeAt(off++);
    c4 = code < BASE64_INDEX.length ? BASE64_INDEX[code] : -1;
    o = (c3 & 3) << 6 >>> 0;
    o |= c4;
    rs.push(String.fromCharCode(o));
    ++olen;
  }
  var res = [];
  for (off = 0; off < olen; off++) res.push(rs[off].charCodeAt(0));
  return res;
}
function _encipher(lr, off, P, S) {
  var n, l = lr[off], r = lr[off + 1];
  l ^= P[0];
  n = S[l >>> 24];
  n += S[256 | l >> 16 & 255];
  n ^= S[512 | l >> 8 & 255];
  n += S[768 | l & 255];
  r ^= n ^ P[1];
  n = S[r >>> 24];
  n += S[256 | r >> 16 & 255];
  n ^= S[512 | r >> 8 & 255];
  n += S[768 | r & 255];
  l ^= n ^ P[2];
  n = S[l >>> 24];
  n += S[256 | l >> 16 & 255];
  n ^= S[512 | l >> 8 & 255];
  n += S[768 | l & 255];
  r ^= n ^ P[3];
  n = S[r >>> 24];
  n += S[256 | r >> 16 & 255];
  n ^= S[512 | r >> 8 & 255];
  n += S[768 | r & 255];
  l ^= n ^ P[4];
  n = S[l >>> 24];
  n += S[256 | l >> 16 & 255];
  n ^= S[512 | l >> 8 & 255];
  n += S[768 | l & 255];
  r ^= n ^ P[5];
  n = S[r >>> 24];
  n += S[256 | r >> 16 & 255];
  n ^= S[512 | r >> 8 & 255];
  n += S[768 | r & 255];
  l ^= n ^ P[6];
  n = S[l >>> 24];
  n += S[256 | l >> 16 & 255];
  n ^= S[512 | l >> 8 & 255];
  n += S[768 | l & 255];
  r ^= n ^ P[7];
  n = S[r >>> 24];
  n += S[256 | r >> 16 & 255];
  n ^= S[512 | r >> 8 & 255];
  n += S[768 | r & 255];
  l ^= n ^ P[8];
  n = S[l >>> 24];
  n += S[256 | l >> 16 & 255];
  n ^= S[512 | l >> 8 & 255];
  n += S[768 | l & 255];
  r ^= n ^ P[9];
  n = S[r >>> 24];
  n += S[256 | r >> 16 & 255];
  n ^= S[512 | r >> 8 & 255];
  n += S[768 | r & 255];
  l ^= n ^ P[10];
  n = S[l >>> 24];
  n += S[256 | l >> 16 & 255];
  n ^= S[512 | l >> 8 & 255];
  n += S[768 | l & 255];
  r ^= n ^ P[11];
  n = S[r >>> 24];
  n += S[256 | r >> 16 & 255];
  n ^= S[512 | r >> 8 & 255];
  n += S[768 | r & 255];
  l ^= n ^ P[12];
  n = S[l >>> 24];
  n += S[256 | l >> 16 & 255];
  n ^= S[512 | l >> 8 & 255];
  n += S[768 | l & 255];
  r ^= n ^ P[13];
  n = S[r >>> 24];
  n += S[256 | r >> 16 & 255];
  n ^= S[512 | r >> 8 & 255];
  n += S[768 | r & 255];
  l ^= n ^ P[14];
  n = S[l >>> 24];
  n += S[256 | l >> 16 & 255];
  n ^= S[512 | l >> 8 & 255];
  n += S[768 | l & 255];
  r ^= n ^ P[15];
  n = S[r >>> 24];
  n += S[256 | r >> 16 & 255];
  n ^= S[512 | r >> 8 & 255];
  n += S[768 | r & 255];
  l ^= n ^ P[16];
  lr[off] = r ^ P[BLOWFISH_NUM_ROUNDS + 1];
  lr[off + 1] = l;
  return lr;
}
function _streamtoword(data, offp) {
  for (var i = 0, word = 0; i < 4; ++i)
    word = word << 8 | data[offp] & 255, offp = (offp + 1) % data.length;
  return { key: word, offp };
}
function _key(key, P, S) {
  var offset = 0, lr = [0, 0], plen = P.length, slen = S.length, sw;
  for (var i = 0; i < plen; i++)
    sw = _streamtoword(key, offset), offset = sw.offp, P[i] = P[i] ^ sw.key;
  for (i = 0; i < plen; i += 2)
    lr = _encipher(lr, 0, P, S), P[i] = lr[0], P[i + 1] = lr[1];
  for (i = 0; i < slen; i += 2)
    lr = _encipher(lr, 0, P, S), S[i] = lr[0], S[i + 1] = lr[1];
}
function _ekskey(data, key, P, S) {
  var offp = 0, lr = [0, 0], plen = P.length, slen = S.length, sw;
  for (var i = 0; i < plen; i++)
    sw = _streamtoword(key, offp), offp = sw.offp, P[i] = P[i] ^ sw.key;
  offp = 0;
  for (i = 0; i < plen; i += 2)
    sw = _streamtoword(data, offp), offp = sw.offp, lr[0] ^= sw.key, sw = _streamtoword(data, offp), offp = sw.offp, lr[1] ^= sw.key, lr = _encipher(lr, 0, P, S), P[i] = lr[0], P[i + 1] = lr[1];
  for (i = 0; i < slen; i += 2)
    sw = _streamtoword(data, offp), offp = sw.offp, lr[0] ^= sw.key, sw = _streamtoword(data, offp), offp = sw.offp, lr[1] ^= sw.key, lr = _encipher(lr, 0, P, S), S[i] = lr[0], S[i + 1] = lr[1];
}
function _crypt(b, salt, rounds, callback, progressCallback) {
  var cdata = C_ORIG.slice(), clen = cdata.length, err;
  if (rounds < 4 || rounds > 31) {
    err = Error("Illegal number of rounds (4-31): " + rounds);
    if (callback) {
      nextTick(callback.bind(this, err));
      return;
    } else throw err;
  }
  if (salt.length !== BCRYPT_SALT_LEN) {
    err = Error(
      "Illegal salt length: " + salt.length + " != " + BCRYPT_SALT_LEN
    );
    if (callback) {
      nextTick(callback.bind(this, err));
      return;
    } else throw err;
  }
  rounds = 1 << rounds >>> 0;
  var P, S, i = 0, j;
  if (typeof Int32Array === "function") {
    P = new Int32Array(P_ORIG);
    S = new Int32Array(S_ORIG);
  } else {
    P = P_ORIG.slice();
    S = S_ORIG.slice();
  }
  _ekskey(salt, b, P, S);
  function next() {
    if (progressCallback) progressCallback(i / rounds);
    if (i < rounds) {
      var start = Date.now();
      for (; i < rounds; ) {
        i = i + 1;
        _key(b, P, S);
        _key(salt, P, S);
        if (Date.now() - start > MAX_EXECUTION_TIME) break;
      }
    } else {
      for (i = 0; i < 64; i++)
        for (j = 0; j < clen >> 1; j++) _encipher(cdata, j << 1, P, S);
      var ret = [];
      for (i = 0; i < clen; i++)
        ret.push((cdata[i] >> 24 & 255) >>> 0), ret.push((cdata[i] >> 16 & 255) >>> 0), ret.push((cdata[i] >> 8 & 255) >>> 0), ret.push((cdata[i] & 255) >>> 0);
      if (callback) {
        callback(null, ret);
        return;
      } else return ret;
    }
    if (callback) nextTick(next);
  }
  __name(next, "next");
  if (typeof callback !== "undefined") {
    next();
  } else {
    var res;
    while (true) if (typeof (res = next()) !== "undefined") return res || [];
  }
}
function _hash(password, salt, callback, progressCallback) {
  var err;
  if (typeof password !== "string" || typeof salt !== "string") {
    err = Error("Invalid string / salt: Not a string");
    if (callback) {
      nextTick(callback.bind(this, err));
      return;
    } else throw err;
  }
  var minor, offset;
  if (salt.charAt(0) !== "$" || salt.charAt(1) !== "2") {
    err = Error("Invalid salt version: " + salt.substring(0, 2));
    if (callback) {
      nextTick(callback.bind(this, err));
      return;
    } else throw err;
  }
  if (salt.charAt(2) === "$") minor = String.fromCharCode(0), offset = 3;
  else {
    minor = salt.charAt(2);
    if (minor !== "a" && minor !== "b" && minor !== "y" || salt.charAt(3) !== "$") {
      err = Error("Invalid salt revision: " + salt.substring(2, 4));
      if (callback) {
        nextTick(callback.bind(this, err));
        return;
      } else throw err;
    }
    offset = 4;
  }
  if (salt.charAt(offset + 2) > "$") {
    err = Error("Missing salt rounds");
    if (callback) {
      nextTick(callback.bind(this, err));
      return;
    } else throw err;
  }
  var r1 = parseInt(salt.substring(offset, offset + 1), 10) * 10, r2 = parseInt(salt.substring(offset + 1, offset + 2), 10), rounds = r1 + r2, real_salt = salt.substring(offset + 3, offset + 25);
  password += minor >= "a" ? "\0" : "";
  var passwordb = utf8Array(password), saltb = base64_decode(real_salt, BCRYPT_SALT_LEN);
  function finish(bytes) {
    var res = [];
    res.push("$2");
    if (minor >= "a") res.push(minor);
    res.push("$");
    if (rounds < 10) res.push("0");
    res.push(rounds.toString());
    res.push("$");
    res.push(base64_encode(saltb, saltb.length));
    res.push(base64_encode(bytes, C_ORIG.length * 4 - 1));
    return res.join("");
  }
  __name(finish, "finish");
  if (typeof callback == "undefined")
    return finish(_crypt(passwordb, saltb, rounds));
  else {
    _crypt(
      passwordb,
      saltb,
      rounds,
      function(err2, bytes) {
        if (err2) callback(err2, null);
        else callback(null, finish(bytes));
      },
      progressCallback
    );
  }
}
function encodeBase642(bytes, length) {
  return base64_encode(bytes, length);
}
function decodeBase642(string, length) {
  return base64_decode(string, length);
}
var import_crypto, randomFallback, nextTick, BASE64_CODE, BASE64_INDEX, BCRYPT_SALT_LEN, GENSALT_DEFAULT_LOG2_ROUNDS, BLOWFISH_NUM_ROUNDS, MAX_EXECUTION_TIME, P_ORIG, S_ORIG, C_ORIG, bcryptjs_default;
var init_bcryptjs = __esm({
  "../node_modules/bcryptjs/index.js"() {
    init_functionsRoutes_0_4727514041666032();
    import_crypto = __toESM(require_crypto(), 1);
    randomFallback = null;
    __name(randomBytes, "randomBytes");
    __name(setRandomFallback, "setRandomFallback");
    __name(genSaltSync, "genSaltSync");
    __name(genSalt, "genSalt");
    __name(hashSync, "hashSync");
    __name(hash, "hash");
    __name(safeStringCompare, "safeStringCompare");
    __name(compareSync, "compareSync");
    __name(compare, "compare");
    __name(getRounds, "getRounds");
    __name(getSalt, "getSalt");
    __name(truncates, "truncates");
    nextTick = typeof setImmediate === "function" ? setImmediate : typeof scheduler === "object" && typeof scheduler.postTask === "function" ? scheduler.postTask.bind(scheduler) : setTimeout;
    __name(utf8Length, "utf8Length");
    __name(utf8Array, "utf8Array");
    BASE64_CODE = "./ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789".split("");
    BASE64_INDEX = [
      -1,
      -1,
      -1,
      -1,
      -1,
      -1,
      -1,
      -1,
      -1,
      -1,
      -1,
      -1,
      -1,
      -1,
      -1,
      -1,
      -1,
      -1,
      -1,
      -1,
      -1,
      -1,
      -1,
      -1,
      -1,
      -1,
      -1,
      -1,
      -1,
      -1,
      -1,
      -1,
      -1,
      -1,
      -1,
      -1,
      -1,
      -1,
      -1,
      -1,
      -1,
      -1,
      -1,
      -1,
      -1,
      -1,
      0,
      1,
      54,
      55,
      56,
      57,
      58,
      59,
      60,
      61,
      62,
      63,
      -1,
      -1,
      -1,
      -1,
      -1,
      -1,
      -1,
      2,
      3,
      4,
      5,
      6,
      7,
      8,
      9,
      10,
      11,
      12,
      13,
      14,
      15,
      16,
      17,
      18,
      19,
      20,
      21,
      22,
      23,
      24,
      25,
      26,
      27,
      -1,
      -1,
      -1,
      -1,
      -1,
      -1,
      28,
      29,
      30,
      31,
      32,
      33,
      34,
      35,
      36,
      37,
      38,
      39,
      40,
      41,
      42,
      43,
      44,
      45,
      46,
      47,
      48,
      49,
      50,
      51,
      52,
      53,
      -1,
      -1,
      -1,
      -1,
      -1
    ];
    __name(base64_encode, "base64_encode");
    __name(base64_decode, "base64_decode");
    BCRYPT_SALT_LEN = 16;
    GENSALT_DEFAULT_LOG2_ROUNDS = 10;
    BLOWFISH_NUM_ROUNDS = 16;
    MAX_EXECUTION_TIME = 100;
    P_ORIG = [
      608135816,
      2242054355,
      320440878,
      57701188,
      2752067618,
      698298832,
      137296536,
      3964562569,
      1160258022,
      953160567,
      3193202383,
      887688300,
      3232508343,
      3380367581,
      1065670069,
      3041331479,
      2450970073,
      2306472731
    ];
    S_ORIG = [
      3509652390,
      2564797868,
      805139163,
      3491422135,
      3101798381,
      1780907670,
      3128725573,
      4046225305,
      614570311,
      3012652279,
      134345442,
      2240740374,
      1667834072,
      1901547113,
      2757295779,
      4103290238,
      227898511,
      1921955416,
      1904987480,
      2182433518,
      2069144605,
      3260701109,
      2620446009,
      720527379,
      3318853667,
      677414384,
      3393288472,
      3101374703,
      2390351024,
      1614419982,
      1822297739,
      2954791486,
      3608508353,
      3174124327,
      2024746970,
      1432378464,
      3864339955,
      2857741204,
      1464375394,
      1676153920,
      1439316330,
      715854006,
      3033291828,
      289532110,
      2706671279,
      2087905683,
      3018724369,
      1668267050,
      732546397,
      1947742710,
      3462151702,
      2609353502,
      2950085171,
      1814351708,
      2050118529,
      680887927,
      999245976,
      1800124847,
      3300911131,
      1713906067,
      1641548236,
      4213287313,
      1216130144,
      1575780402,
      4018429277,
      3917837745,
      3693486850,
      3949271944,
      596196993,
      3549867205,
      258830323,
      2213823033,
      772490370,
      2760122372,
      1774776394,
      2652871518,
      566650946,
      4142492826,
      1728879713,
      2882767088,
      1783734482,
      3629395816,
      2517608232,
      2874225571,
      1861159788,
      326777828,
      3124490320,
      2130389656,
      2716951837,
      967770486,
      1724537150,
      2185432712,
      2364442137,
      1164943284,
      2105845187,
      998989502,
      3765401048,
      2244026483,
      1075463327,
      1455516326,
      1322494562,
      910128902,
      469688178,
      1117454909,
      936433444,
      3490320968,
      3675253459,
      1240580251,
      122909385,
      2157517691,
      634681816,
      4142456567,
      3825094682,
      3061402683,
      2540495037,
      79693498,
      3249098678,
      1084186820,
      1583128258,
      426386531,
      1761308591,
      1047286709,
      322548459,
      995290223,
      1845252383,
      2603652396,
      3431023940,
      2942221577,
      3202600964,
      3727903485,
      1712269319,
      422464435,
      3234572375,
      1170764815,
      3523960633,
      3117677531,
      1434042557,
      442511882,
      3600875718,
      1076654713,
      1738483198,
      4213154764,
      2393238008,
      3677496056,
      1014306527,
      4251020053,
      793779912,
      2902807211,
      842905082,
      4246964064,
      1395751752,
      1040244610,
      2656851899,
      3396308128,
      445077038,
      3742853595,
      3577915638,
      679411651,
      2892444358,
      2354009459,
      1767581616,
      3150600392,
      3791627101,
      3102740896,
      284835224,
      4246832056,
      1258075500,
      768725851,
      2589189241,
      3069724005,
      3532540348,
      1274779536,
      3789419226,
      2764799539,
      1660621633,
      3471099624,
      4011903706,
      913787905,
      3497959166,
      737222580,
      2514213453,
      2928710040,
      3937242737,
      1804850592,
      3499020752,
      2949064160,
      2386320175,
      2390070455,
      2415321851,
      4061277028,
      2290661394,
      2416832540,
      1336762016,
      1754252060,
      3520065937,
      3014181293,
      791618072,
      3188594551,
      3933548030,
      2332172193,
      3852520463,
      3043980520,
      413987798,
      3465142937,
      3030929376,
      4245938359,
      2093235073,
      3534596313,
      375366246,
      2157278981,
      2479649556,
      555357303,
      3870105701,
      2008414854,
      3344188149,
      4221384143,
      3956125452,
      2067696032,
      3594591187,
      2921233993,
      2428461,
      544322398,
      577241275,
      1471733935,
      610547355,
      4027169054,
      1432588573,
      1507829418,
      2025931657,
      3646575487,
      545086370,
      48609733,
      2200306550,
      1653985193,
      298326376,
      1316178497,
      3007786442,
      2064951626,
      458293330,
      2589141269,
      3591329599,
      3164325604,
      727753846,
      2179363840,
      146436021,
      1461446943,
      4069977195,
      705550613,
      3059967265,
      3887724982,
      4281599278,
      3313849956,
      1404054877,
      2845806497,
      146425753,
      1854211946,
      1266315497,
      3048417604,
      3681880366,
      3289982499,
      290971e4,
      1235738493,
      2632868024,
      2414719590,
      3970600049,
      1771706367,
      1449415276,
      3266420449,
      422970021,
      1963543593,
      2690192192,
      3826793022,
      1062508698,
      1531092325,
      1804592342,
      2583117782,
      2714934279,
      4024971509,
      1294809318,
      4028980673,
      1289560198,
      2221992742,
      1669523910,
      35572830,
      157838143,
      1052438473,
      1016535060,
      1802137761,
      1753167236,
      1386275462,
      3080475397,
      2857371447,
      1040679964,
      2145300060,
      2390574316,
      1461121720,
      2956646967,
      4031777805,
      4028374788,
      33600511,
      2920084762,
      1018524850,
      629373528,
      3691585981,
      3515945977,
      2091462646,
      2486323059,
      586499841,
      988145025,
      935516892,
      3367335476,
      2599673255,
      2839830854,
      265290510,
      3972581182,
      2759138881,
      3795373465,
      1005194799,
      847297441,
      406762289,
      1314163512,
      1332590856,
      1866599683,
      4127851711,
      750260880,
      613907577,
      1450815602,
      3165620655,
      3734664991,
      3650291728,
      3012275730,
      3704569646,
      1427272223,
      778793252,
      1343938022,
      2676280711,
      2052605720,
      1946737175,
      3164576444,
      3914038668,
      3967478842,
      3682934266,
      1661551462,
      3294938066,
      4011595847,
      840292616,
      3712170807,
      616741398,
      312560963,
      711312465,
      1351876610,
      322626781,
      1910503582,
      271666773,
      2175563734,
      1594956187,
      70604529,
      3617834859,
      1007753275,
      1495573769,
      4069517037,
      2549218298,
      2663038764,
      504708206,
      2263041392,
      3941167025,
      2249088522,
      1514023603,
      1998579484,
      1312622330,
      694541497,
      2582060303,
      2151582166,
      1382467621,
      776784248,
      2618340202,
      3323268794,
      2497899128,
      2784771155,
      503983604,
      4076293799,
      907881277,
      423175695,
      432175456,
      1378068232,
      4145222326,
      3954048622,
      3938656102,
      3820766613,
      2793130115,
      2977904593,
      26017576,
      3274890735,
      3194772133,
      1700274565,
      1756076034,
      4006520079,
      3677328699,
      720338349,
      1533947780,
      354530856,
      688349552,
      3973924725,
      1637815568,
      332179504,
      3949051286,
      53804574,
      2852348879,
      3044236432,
      1282449977,
      3583942155,
      3416972820,
      4006381244,
      1617046695,
      2628476075,
      3002303598,
      1686838959,
      431878346,
      2686675385,
      1700445008,
      1080580658,
      1009431731,
      832498133,
      3223435511,
      2605976345,
      2271191193,
      2516031870,
      1648197032,
      4164389018,
      2548247927,
      300782431,
      375919233,
      238389289,
      3353747414,
      2531188641,
      2019080857,
      1475708069,
      455242339,
      2609103871,
      448939670,
      3451063019,
      1395535956,
      2413381860,
      1841049896,
      1491858159,
      885456874,
      4264095073,
      4001119347,
      1565136089,
      3898914787,
      1108368660,
      540939232,
      1173283510,
      2745871338,
      3681308437,
      4207628240,
      3343053890,
      4016749493,
      1699691293,
      1103962373,
      3625875870,
      2256883143,
      3830138730,
      1031889488,
      3479347698,
      1535977030,
      4236805024,
      3251091107,
      2132092099,
      1774941330,
      1199868427,
      1452454533,
      157007616,
      2904115357,
      342012276,
      595725824,
      1480756522,
      206960106,
      497939518,
      591360097,
      863170706,
      2375253569,
      3596610801,
      1814182875,
      2094937945,
      3421402208,
      1082520231,
      3463918190,
      2785509508,
      435703966,
      3908032597,
      1641649973,
      2842273706,
      3305899714,
      1510255612,
      2148256476,
      2655287854,
      3276092548,
      4258621189,
      236887753,
      3681803219,
      274041037,
      1734335097,
      3815195456,
      3317970021,
      1899903192,
      1026095262,
      4050517792,
      356393447,
      2410691914,
      3873677099,
      3682840055,
      3913112168,
      2491498743,
      4132185628,
      2489919796,
      1091903735,
      1979897079,
      3170134830,
      3567386728,
      3557303409,
      857797738,
      1136121015,
      1342202287,
      507115054,
      2535736646,
      337727348,
      3213592640,
      1301675037,
      2528481711,
      1895095763,
      1721773893,
      3216771564,
      62756741,
      2142006736,
      835421444,
      2531993523,
      1442658625,
      3659876326,
      2882144922,
      676362277,
      1392781812,
      170690266,
      3921047035,
      1759253602,
      3611846912,
      1745797284,
      664899054,
      1329594018,
      3901205900,
      3045908486,
      2062866102,
      2865634940,
      3543621612,
      3464012697,
      1080764994,
      553557557,
      3656615353,
      3996768171,
      991055499,
      499776247,
      1265440854,
      648242737,
      3940784050,
      980351604,
      3713745714,
      1749149687,
      3396870395,
      4211799374,
      3640570775,
      1161844396,
      3125318951,
      1431517754,
      545492359,
      4268468663,
      3499529547,
      1437099964,
      2702547544,
      3433638243,
      2581715763,
      2787789398,
      1060185593,
      1593081372,
      2418618748,
      4260947970,
      69676912,
      2159744348,
      86519011,
      2512459080,
      3838209314,
      1220612927,
      3339683548,
      133810670,
      1090789135,
      1078426020,
      1569222167,
      845107691,
      3583754449,
      4072456591,
      1091646820,
      628848692,
      1613405280,
      3757631651,
      526609435,
      236106946,
      48312990,
      2942717905,
      3402727701,
      1797494240,
      859738849,
      992217954,
      4005476642,
      2243076622,
      3870952857,
      3732016268,
      765654824,
      3490871365,
      2511836413,
      1685915746,
      3888969200,
      1414112111,
      2273134842,
      3281911079,
      4080962846,
      172450625,
      2569994100,
      980381355,
      4109958455,
      2819808352,
      2716589560,
      2568741196,
      3681446669,
      3329971472,
      1835478071,
      660984891,
      3704678404,
      4045999559,
      3422617507,
      3040415634,
      1762651403,
      1719377915,
      3470491036,
      2693910283,
      3642056355,
      3138596744,
      1364962596,
      2073328063,
      1983633131,
      926494387,
      3423689081,
      2150032023,
      4096667949,
      1749200295,
      3328846651,
      309677260,
      2016342300,
      1779581495,
      3079819751,
      111262694,
      1274766160,
      443224088,
      298511866,
      1025883608,
      3806446537,
      1145181785,
      168956806,
      3641502830,
      3584813610,
      1689216846,
      3666258015,
      3200248200,
      1692713982,
      2646376535,
      4042768518,
      1618508792,
      1610833997,
      3523052358,
      4130873264,
      2001055236,
      3610705100,
      2202168115,
      4028541809,
      2961195399,
      1006657119,
      2006996926,
      3186142756,
      1430667929,
      3210227297,
      1314452623,
      4074634658,
      4101304120,
      2273951170,
      1399257539,
      3367210612,
      3027628629,
      1190975929,
      2062231137,
      2333990788,
      2221543033,
      2438960610,
      1181637006,
      548689776,
      2362791313,
      3372408396,
      3104550113,
      3145860560,
      296247880,
      1970579870,
      3078560182,
      3769228297,
      1714227617,
      3291629107,
      3898220290,
      166772364,
      1251581989,
      493813264,
      448347421,
      195405023,
      2709975567,
      677966185,
      3703036547,
      1463355134,
      2715995803,
      1338867538,
      1343315457,
      2802222074,
      2684532164,
      233230375,
      2599980071,
      2000651841,
      3277868038,
      1638401717,
      4028070440,
      3237316320,
      6314154,
      819756386,
      300326615,
      590932579,
      1405279636,
      3267499572,
      3150704214,
      2428286686,
      3959192993,
      3461946742,
      1862657033,
      1266418056,
      963775037,
      2089974820,
      2263052895,
      1917689273,
      448879540,
      3550394620,
      3981727096,
      150775221,
      3627908307,
      1303187396,
      508620638,
      2975983352,
      2726630617,
      1817252668,
      1876281319,
      1457606340,
      908771278,
      3720792119,
      3617206836,
      2455994898,
      1729034894,
      1080033504,
      976866871,
      3556439503,
      2881648439,
      1522871579,
      1555064734,
      1336096578,
      3548522304,
      2579274686,
      3574697629,
      3205460757,
      3593280638,
      3338716283,
      3079412587,
      564236357,
      2993598910,
      1781952180,
      1464380207,
      3163844217,
      3332601554,
      1699332808,
      1393555694,
      1183702653,
      3581086237,
      1288719814,
      691649499,
      2847557200,
      2895455976,
      3193889540,
      2717570544,
      1781354906,
      1676643554,
      2592534050,
      3230253752,
      1126444790,
      2770207658,
      2633158820,
      2210423226,
      2615765581,
      2414155088,
      3127139286,
      673620729,
      2805611233,
      1269405062,
      4015350505,
      3341807571,
      4149409754,
      1057255273,
      2012875353,
      2162469141,
      2276492801,
      2601117357,
      993977747,
      3918593370,
      2654263191,
      753973209,
      36408145,
      2530585658,
      25011837,
      3520020182,
      2088578344,
      530523599,
      2918365339,
      1524020338,
      1518925132,
      3760827505,
      3759777254,
      1202760957,
      3985898139,
      3906192525,
      674977740,
      4174734889,
      2031300136,
      2019492241,
      3983892565,
      4153806404,
      3822280332,
      352677332,
      2297720250,
      60907813,
      90501309,
      3286998549,
      1016092578,
      2535922412,
      2839152426,
      457141659,
      509813237,
      4120667899,
      652014361,
      1966332200,
      2975202805,
      55981186,
      2327461051,
      676427537,
      3255491064,
      2882294119,
      3433927263,
      1307055953,
      942726286,
      933058658,
      2468411793,
      3933900994,
      4215176142,
      1361170020,
      2001714738,
      2830558078,
      3274259782,
      1222529897,
      1679025792,
      2729314320,
      3714953764,
      1770335741,
      151462246,
      3013232138,
      1682292957,
      1483529935,
      471910574,
      1539241949,
      458788160,
      3436315007,
      1807016891,
      3718408830,
      978976581,
      1043663428,
      3165965781,
      1927990952,
      4200891579,
      2372276910,
      3208408903,
      3533431907,
      1412390302,
      2931980059,
      4132332400,
      1947078029,
      3881505623,
      4168226417,
      2941484381,
      1077988104,
      1320477388,
      886195818,
      18198404,
      3786409e3,
      2509781533,
      112762804,
      3463356488,
      1866414978,
      891333506,
      18488651,
      661792760,
      1628790961,
      3885187036,
      3141171499,
      876946877,
      2693282273,
      1372485963,
      791857591,
      2686433993,
      3759982718,
      3167212022,
      3472953795,
      2716379847,
      445679433,
      3561995674,
      3504004811,
      3574258232,
      54117162,
      3331405415,
      2381918588,
      3769707343,
      4154350007,
      1140177722,
      4074052095,
      668550556,
      3214352940,
      367459370,
      261225585,
      2610173221,
      4209349473,
      3468074219,
      3265815641,
      314222801,
      3066103646,
      3808782860,
      282218597,
      3406013506,
      3773591054,
      379116347,
      1285071038,
      846784868,
      2669647154,
      3771962079,
      3550491691,
      2305946142,
      453669953,
      1268987020,
      3317592352,
      3279303384,
      3744833421,
      2610507566,
      3859509063,
      266596637,
      3847019092,
      517658769,
      3462560207,
      3443424879,
      370717030,
      4247526661,
      2224018117,
      4143653529,
      4112773975,
      2788324899,
      2477274417,
      1456262402,
      2901442914,
      1517677493,
      1846949527,
      2295493580,
      3734397586,
      2176403920,
      1280348187,
      1908823572,
      3871786941,
      846861322,
      1172426758,
      3287448474,
      3383383037,
      1655181056,
      3139813346,
      901632758,
      1897031941,
      2986607138,
      3066810236,
      3447102507,
      1393639104,
      373351379,
      950779232,
      625454576,
      3124240540,
      4148612726,
      2007998917,
      544563296,
      2244738638,
      2330496472,
      2058025392,
      1291430526,
      424198748,
      50039436,
      29584100,
      3605783033,
      2429876329,
      2791104160,
      1057563949,
      3255363231,
      3075367218,
      3463963227,
      1469046755,
      985887462
    ];
    C_ORIG = [
      1332899944,
      1700884034,
      1701343084,
      1684370003,
      1668446532,
      1869963892
    ];
    __name(_encipher, "_encipher");
    __name(_streamtoword, "_streamtoword");
    __name(_key, "_key");
    __name(_ekskey, "_ekskey");
    __name(_crypt, "_crypt");
    __name(_hash, "_hash");
    __name(encodeBase642, "encodeBase64");
    __name(decodeBase642, "decodeBase64");
    bcryptjs_default = {
      setRandomFallback,
      genSaltSync,
      genSalt,
      hashSync,
      hash,
      compareSync,
      compare,
      getRounds,
      getSalt,
      truncates,
      encodeBase64: encodeBase642,
      decodeBase64: decodeBase642
    };
  }
});

// api/login.js
async function onRequestPost4({ request, env }) {
  const db = drizzle(env.MOSHLY_DB);
  try {
    const clientIp = getClientIp(request);
    const ipRetryAfter = await applyRateLimit(env.AUTH_KV, "login", `ip:${clientIp}`);
    if (ipRetryAfter) return rateLimitedResponse(ipRetryAfter);
    let email, password;
    try {
      ({ email, password } = await request.json());
    } catch {
      return new Response(JSON.stringify({ error: "Invalid request body" }), {
        status: 400,
        headers: { "Content-Type": "application/json" }
      });
    }
    if (!email || !password) {
      return new Response(JSON.stringify({ error: "Email and password are required" }), {
        status: 400,
        headers: { "Content-Type": "application/json" }
      });
    }
    const emailRetryAfter = await applyRateLimit(env.AUTH_KV, "login", `email:${email.toLowerCase()}`);
    if (emailRetryAfter) return rateLimitedResponse(emailRetryAfter);
    const loginResult = await db.select({
      user: users,
      profile: profiles,
      workspace: workspaces,
      subscription: subscriptions
    }).from(users).leftJoin(profiles, eq(profiles.userId, users.id)).leftJoin(workspaces, eq(workspaces.ownerId, users.id)).leftJoin(subscriptions, eq(subscriptions.workspaceId, workspaces.id)).where(eq(users.email, email)).get();
    if (!loginResult || !loginResult.user) {
      return new Response(JSON.stringify({ error: "Invalid credentials" }), {
        status: 401,
        headers: { "Content-Type": "application/json" }
      });
    }
    const { user, profile, subscription } = loginResult;
    if (!user.emailVerified) {
      return new Response(JSON.stringify({ error: "Please confirm your email before logging in" }), {
        status: 403,
        headers: { "Content-Type": "application/json" }
      });
    }
    const isPasswordValid = await bcryptjs_default.compare(password, user.passwordHash);
    if (!isPasswordValid) {
      return new Response(JSON.stringify({ error: "Invalid credentials" }), {
        status: 401,
        headers: { "Content-Type": "application/json" }
      });
    }
    if (!env.JWT_SECRET) {
      throw new Error("CRITICAL: JWT_SECRET environment variable is not set");
    }
    const secret = new TextEncoder().encode(env.JWT_SECRET);
    const accessToken = await new SignJWT({
      userId: user.id,
      email: user.email,
      role: user.role,
      plan: subscription?.plan || "free"
    }).setProtectedHeader({ alg: "HS256" }).setIssuedAt().setIssuer("moshly").setAudience("moshly-api").setExpirationTime("15m").sign(secret);
    const refreshToken = crypto.randomUUID();
    const RT_TTL = 7 * 24 * 3600;
    if (env.AUTH_KV) {
      await Promise.all([
        env.AUTH_KV.put(`rt:${refreshToken}`, JSON.stringify({ userId: user.id }), { expirationTtl: RT_TTL }),
        env.AUTH_KV.put(`rt:user:${user.id}`, refreshToken, { expirationTtl: RT_TTL })
      ]);
    }
    const isSecure = new URL(request.url).protocol === "https:";
    const refreshCookie = `moshly_rt=${refreshToken}; HttpOnly${isSecure ? "; Secure" : ""}; SameSite=Strict; Path=/api; Max-Age=604800`;
    return new Response(JSON.stringify({
      success: true,
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        role: user.role,
        plan: subscription?.plan || "free",
        jobTitle: profile?.jobTitle || null,
        organization: profile?.organization || null
      },
      token: accessToken
    }), {
      status: 200,
      headers: {
        "Content-Type": "application/json",
        "Set-Cookie": refreshCookie
      }
    });
  } catch (error) {
    console.error("Login error:", error.message);
    return new Response(JSON.stringify({ error: "Server error during login" }), {
      status: 500,
      headers: { "Content-Type": "application/json" }
    });
  }
}
async function onRequestOptions5({ request }) {
  return new Response(null, {
    status: 204,
    headers: {
      "Access-Control-Allow-Origin": getAllowedOrigin(request),
      "Access-Control-Allow-Methods": "POST, OPTIONS",
      "Access-Control-Allow-Headers": "Content-Type, Authorization"
    }
  });
}
var init_login = __esm({
  "api/login.js"() {
    init_functionsRoutes_0_4727514041666032();
    init_d1();
    init_schema();
    init_bcryptjs();
    init_webapi();
    init_drizzle_orm();
    init_rate_limit();
    init_cors();
    __name(onRequestPost4, "onRequestPost");
    __name(onRequestOptions5, "onRequestOptions");
  }
});

// api/logout.js
async function onRequestPost5({ request, env }) {
  const cookieHeader = request.headers.get("Cookie") || "";
  const match2 = cookieHeader.match(/(?:^|;\s*)moshly_rt=([^;]+)/);
  const refreshToken = match2?.[1];
  if (refreshToken && env.AUTH_KV) {
    const stored = await env.AUTH_KV.get(`rt:${refreshToken}`);
    const keysToDelete = [`rt:${refreshToken}`];
    if (stored) {
      try {
        const { userId } = JSON.parse(stored);
        if (userId) keysToDelete.push(`rt:user:${userId}`);
      } catch {
      }
    }
    await Promise.all(keysToDelete.map((k) => env.AUTH_KV.delete(k)));
  }
  const isSecure = new URL(request.url).protocol === "https:";
  const clearCookie = `moshly_rt=; HttpOnly${isSecure ? "; Secure" : ""}; SameSite=Strict; Path=/api; Max-Age=0`;
  return new Response(JSON.stringify({ success: true }), {
    status: 200,
    headers: {
      "Content-Type": "application/json",
      "Set-Cookie": clearCookie
    }
  });
}
var onRequestOptions6;
var init_logout = __esm({
  "api/logout.js"() {
    init_functionsRoutes_0_4727514041666032();
    init_cors();
    __name(onRequestPost5, "onRequestPost");
    onRequestOptions6 = /* @__PURE__ */ __name(({ request }) => corsOptionsResponse(request, "POST, OPTIONS"), "onRequestOptions");
  }
});

// api/me.js
async function onRequestGet2({ request, env }) {
  const payload = await verifyJWT(request, env);
  if (!payload) {
    return new Response(JSON.stringify({ error: "Unauthorized" }), {
      status: 401,
      headers: { "Content-Type": "application/json" }
    });
  }
  const db = drizzle(env.MOSHLY_DB);
  try {
    const result = await db.select({
      user: users,
      profile: profiles,
      workspace: workspaces,
      subscription: subscriptions
    }).from(users).leftJoin(profiles, eq(profiles.userId, users.id)).leftJoin(workspaces, eq(workspaces.ownerId, users.id)).leftJoin(subscriptions, eq(subscriptions.workspaceId, workspaces.id)).where(eq(users.id, payload.userId)).get();
    if (!result || !result.user) {
      return new Response(JSON.stringify({ error: "User not found" }), {
        status: 404,
        headers: { "Content-Type": "application/json" }
      });
    }
    const { user, profile, workspace, subscription } = result;
    return new Response(JSON.stringify({
      success: true,
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        role: user.role,
        avatarUrl: user.avatarUrl,
        profile: profile ? {
          firstName: profile.firstName,
          lastName: profile.lastName,
          jobTitle: profile.jobTitle,
          organization: profile.organization,
          bio: profile.bio,
          skills: profile.skills,
          location: profile.location
        } : null,
        subscription: subscription ? {
          plan: subscription.plan,
          pdfExportsLimit: subscription.pdfExportsLimit,
          pdfExportsUsed: subscription.pdfExportsUsed,
          aiCreditsLimit: subscription.aiCreditsLimit,
          aiCreditsUsed: subscription.aiCreditsUsed,
          expiresAt: subscription.expiresAt
        } : null
      }
    }), {
      status: 200,
      headers: { "Content-Type": "application/json" }
    });
  } catch (error) {
    console.error("Fetch user error:", error);
    return new Response(JSON.stringify({ error: "Server error fetching profile" }), {
      status: 500,
      headers: { "Content-Type": "application/json" }
    });
  }
}
async function onRequestPatch({ request, env }) {
  const payload = await verifyJWT(request, env);
  if (!payload) {
    return new Response(JSON.stringify({ error: "Unauthorized" }), {
      status: 401,
      headers: { "Content-Type": "application/json" }
    });
  }
  const clientIp = getClientIp(request);
  const patchRetryAfter = await applyRateLimit(env.AUTH_KV, "me-patch", `ip:${clientIp}`);
  if (patchRetryAfter) return rateLimitedResponse(patchRetryAfter);
  let body;
  try {
    body = await request.json();
  } catch {
    return new Response(JSON.stringify({ error: "Invalid request body" }), {
      status: 400,
      headers: { "Content-Type": "application/json" }
    });
  }
  const name = body.name !== void 0 ? String(body.name || "").trim().slice(0, MAX_FIELD_LENGTH) : void 0;
  const firstName = body.first_name !== void 0 ? String(body.first_name || "").trim().slice(0, MAX_FIELD_LENGTH) : void 0;
  const lastName = body.last_name !== void 0 ? String(body.last_name || "").trim().slice(0, MAX_FIELD_LENGTH) : void 0;
  const jobTitle = body.job_title !== void 0 ? String(body.job_title || "").trim().slice(0, MAX_FIELD_LENGTH) : void 0;
  const org = body.organization !== void 0 || body.org !== void 0 ? String(body.organization || body.org || "").trim().slice(0, MAX_FIELD_LENGTH) : void 0;
  const location = body.location !== void 0 ? String(body.location || "").trim().slice(0, MAX_FIELD_LENGTH) : void 0;
  const skills = body.skills !== void 0 ? String(body.skills || "").trim().slice(0, MAX_FIELD_LENGTH) : void 0;
  const avatarUrl = body.avatarUrl !== void 0 ? String(body.avatarUrl).trim().slice(0, 2048) : void 0;
  const db = drizzle(env.MOSHLY_DB);
  try {
    const userUpdate = {};
    if (name !== void 0) userUpdate.name = name;
    if (avatarUrl !== void 0) userUpdate.avatarUrl = avatarUrl;
    const profileUpdate = {};
    if (firstName !== void 0) profileUpdate.firstName = firstName;
    if (lastName !== void 0) profileUpdate.lastName = lastName;
    if (jobTitle !== void 0) profileUpdate.jobTitle = jobTitle;
    if (org !== void 0) profileUpdate.organization = org;
    if (location !== void 0) profileUpdate.location = location;
    if (skills !== void 0) profileUpdate.skills = skills;
    const updates = [];
    if (Object.keys(userUpdate).length > 0) {
      updates.push(
        db.update(users).set(userUpdate).where(eq(users.id, payload.userId))
      );
    }
    if (Object.keys(profileUpdate).length > 0) {
      updates.push(
        db.insert(profiles).values({ userId: payload.userId, ...profileUpdate }).onConflictDoUpdate({
          target: profiles.userId,
          set: profileUpdate
        })
      );
    }
    if (updates.length > 0) {
      await db.batch(updates);
    }
    console.info("Profile updated", { userId: payload.userId });
    return new Response(JSON.stringify({
      success: true,
      user: {
        name,
        firstName,
        lastName,
        jobTitle,
        organization: org,
        location,
        skills
      }
    }), {
      status: 200,
      headers: { "Content-Type": "application/json" }
    });
  } catch (error) {
    console.error("Update profile error:", { error: error.message, userId: payload.userId });
    return new Response(JSON.stringify({ error: "Server error updating profile" }), {
      status: 500,
      headers: { "Content-Type": "application/json" }
    });
  }
}
async function onRequestDelete2({ request, env }) {
  const payload = await verifyJWT(request, env);
  if (!payload) {
    return new Response(JSON.stringify({ error: "Unauthorized" }), {
      status: 401,
      headers: { "Content-Type": "application/json" }
    });
  }
  const clientIp = getClientIp(request);
  const deleteRetryAfter = await applyRateLimit(env.AUTH_KV, "me-delete", `ip:${clientIp}`);
  if (deleteRetryAfter) return rateLimitedResponse(deleteRetryAfter);
  let body;
  try {
    body = await request.json();
  } catch {
    return new Response(JSON.stringify({ error: "Invalid request body" }), {
      status: 400,
      headers: { "Content-Type": "application/json" }
    });
  }
  const { timing } = body;
  if (timing !== "now" && timing !== "end_of_cycle") {
    return new Response(JSON.stringify({ error: "Invalid timing option" }), {
      status: 400,
      headers: { "Content-Type": "application/json" }
    });
  }
  const db = drizzle(env.MOSHLY_DB);
  try {
    if (timing === "now") {
      await db.delete(users).where(eq(users.id, payload.userId)).run();
      console.info("Account terminated NOW", { userId: payload.userId });
      return new Response(JSON.stringify({ success: true, message: "Account terminated immediately" }), {
        status: 200,
        headers: { "Content-Type": "application/json" }
      });
    } else {
      const existingSub = await db.select().from(subscriptions).innerJoin(workspaces, eq(workspaces.id, subscriptions.workspaceId)).where(eq(workspaces.ownerId, payload.userId)).get();
      const endOfCycle = existingSub?.subscriptions?.expiresAt || new Date(Date.now() + 30 * 24 * 60 * 60 * 1e3);
      await db.update(subscriptions).set({ expiresAt: endOfCycle }).where(eq(subscriptions.workspaceId, existingSub.subscriptions.workspaceId)).run();
      console.info("Account scheduled for termination", { userId: payload.userId, expiresAt: endOfCycle });
      return new Response(JSON.stringify({ success: true, message: "Account scheduled for termination", expiresAt: endOfCycle }), {
        status: 200,
        headers: { "Content-Type": "application/json" }
      });
    }
  } catch (error) {
    console.error("Delete account error:", { error: error.message, userId: payload.userId });
    return new Response(JSON.stringify({ error: "Server error during account termination" }), {
      status: 500,
      headers: { "Content-Type": "application/json" }
    });
  }
}
var MAX_FIELD_LENGTH, onRequestOptions7;
var init_me = __esm({
  "api/me.js"() {
    init_functionsRoutes_0_4727514041666032();
    init_d1();
    init_schema();
    init_middleware_auth();
    init_drizzle_orm();
    init_rate_limit();
    init_cors();
    MAX_FIELD_LENGTH = 200;
    __name(onRequestGet2, "onRequestGet");
    __name(onRequestPatch, "onRequestPatch");
    __name(onRequestDelete2, "onRequestDelete");
    onRequestOptions7 = /* @__PURE__ */ __name(({ request }) => corsOptionsResponse(request, "GET, PATCH, DELETE, OPTIONS"), "onRequestOptions");
  }
});

// api/refresh.js
async function onRequestPost6({ request, env }) {
  try {
    const clientIp = getClientIp(request);
    const ipRetryAfter = await applyRateLimit(env.AUTH_KV, "refresh", `ip:${clientIp}`);
    if (ipRetryAfter) return rateLimitedResponse(ipRetryAfter);
    const cookieHeader = request.headers.get("Cookie") || "";
    const match2 = cookieHeader.match(/(?:^|;\s*)moshly_rt=([^;]+)/);
    const refreshToken = match2?.[1];
    if (!refreshToken) {
      return new Response(JSON.stringify({ error: "Refresh token is required" }), {
        status: 401,
        headers: { "Content-Type": "application/json" }
      });
    }
    if (!env.AUTH_KV) {
      throw new Error("CRITICAL: AUTH_KV binding is not configured");
    }
    if (!env.JWT_SECRET) {
      throw new Error("CRITICAL: JWT_SECRET environment variable is not configured");
    }
    const lockKey = `rt:lock:${refreshToken}`;
    const existingLock = await env.AUTH_KV.get(lockKey);
    if (existingLock) {
      return new Response(JSON.stringify({ error: "Refresh in progress, please retry" }), {
        status: 409,
        headers: { "Content-Type": "application/json" }
      });
    }
    await env.AUTH_KV.put(lockKey, "1", { expirationTtl: 60 });
    const storedValue = await env.AUTH_KV.get(`rt:${refreshToken}`);
    if (!storedValue) {
      return new Response(JSON.stringify({ error: "Invalid or expired refresh token" }), {
        status: 401,
        headers: { "Content-Type": "application/json" }
      });
    }
    const { userId } = JSON.parse(storedValue);
    await env.AUTH_KV.delete(`rt:${refreshToken}`);
    const db = drizzle(env.MOSHLY_DB);
    const refreshResult = await db.select({
      user: users,
      profile: profiles,
      subscription: subscriptions
    }).from(users).leftJoin(profiles, eq(profiles.userId, users.id)).leftJoin(workspaces, eq(workspaces.ownerId, users.id)).leftJoin(subscriptions, eq(subscriptions.workspaceId, workspaces.id)).where(eq(users.id, userId)).get();
    if (!refreshResult?.user) {
      return new Response(JSON.stringify({ error: "User not found" }), {
        status: 401,
        headers: { "Content-Type": "application/json" }
      });
    }
    const { user, profile, subscription } = refreshResult;
    const secret = new TextEncoder().encode(env.JWT_SECRET);
    const newAccessToken = await new SignJWT({
      userId: user.id,
      email: user.email,
      role: user.role,
      plan: subscription?.plan || "free"
    }).setProtectedHeader({ alg: "HS256" }).setIssuedAt().setIssuer("moshly").setAudience("moshly-api").setExpirationTime("15m").sign(secret);
    const newRefreshToken = crypto.randomUUID();
    const RT_TTL = 7 * 24 * 3600;
    await Promise.all([
      env.AUTH_KV.put(`rt:${newRefreshToken}`, JSON.stringify({ userId: user.id }), { expirationTtl: RT_TTL }),
      env.AUTH_KV.put(`rt:user:${user.id}`, newRefreshToken, { expirationTtl: RT_TTL })
    ]);
    const isSecure = new URL(request.url).protocol === "https:";
    const refreshCookie = `moshly_rt=${newRefreshToken}; HttpOnly${isSecure ? "; Secure" : ""}; SameSite=Strict; Path=/api; Max-Age=604800`;
    return new Response(
      JSON.stringify({
        success: true,
        token: newAccessToken,
        user: {
          id: user.id,
          email: user.email,
          name: user.name,
          role: user.role,
          plan: subscription?.plan || "free",
          jobTitle: profile?.jobTitle || null,
          organization: profile?.organization || null
        }
      }),
      { status: 200, headers: { "Content-Type": "application/json", "Set-Cookie": refreshCookie } }
    );
  } catch (error) {
    console.error("Refresh token error:", error.message);
    return new Response(JSON.stringify({ error: "Server error during token refresh" }), {
      status: 500,
      headers: { "Content-Type": "application/json" }
    });
  }
}
var onRequestOptions8;
var init_refresh = __esm({
  "api/refresh.js"() {
    init_functionsRoutes_0_4727514041666032();
    init_d1();
    init_schema();
    init_webapi();
    init_drizzle_orm();
    init_rate_limit();
    init_cors();
    __name(onRequestPost6, "onRequestPost");
    onRequestOptions8 = /* @__PURE__ */ __name(({ request }) => corsOptionsResponse(request, "POST, OPTIONS"), "onRequestOptions");
  }
});

// api/_password.js
function validatePassword(password) {
  if (password.length < MIN_PASSWORD_LENGTH) {
    return `Password must be at least ${MIN_PASSWORD_LENGTH} characters`;
  }
  if (!/[^a-zA-Z]/.test(password)) {
    return "Password must contain at least one non-letter character";
  }
  return null;
}
var MIN_PASSWORD_LENGTH;
var init_password = __esm({
  "api/_password.js"() {
    init_functionsRoutes_0_4727514041666032();
    MIN_PASSWORD_LENGTH = 12;
    __name(validatePassword, "validatePassword");
  }
});

// api/_plans.js
var PLAN_LIMITS, GOD_TIER_PLANS, SUBSCRIPTION_PLANS;
var init_plans = __esm({
  "api/_plans.js"() {
    init_functionsRoutes_0_4727514041666032();
    PLAN_LIMITS = {
      free: { pdfExportsLimit: 1, aiCreditsLimit: 100 },
      solo: { pdfExportsLimit: 12, aiCreditsLimit: 500 },
      collective: { pdfExportsLimit: 50, aiCreditsLimit: 1250 },
      business: { pdfExportsLimit: 100, aiCreditsLimit: 2500 },
      major: { pdfExportsLimit: 250, aiCreditsLimit: 6e3 }
    };
    GOD_TIER_PLANS = /* @__PURE__ */ new Set(["god", "semi_god"]);
    SUBSCRIPTION_PLANS = new Set(Object.keys(PLAN_LIMITS));
  }
});

// api/register.js
async function sha256Hex2(input) {
  const buffer = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(input));
  return Array.from(new Uint8Array(buffer)).map((b) => b.toString(16).padStart(2, "0")).join("");
}
async function onRequestPost7({ request, env }) {
  const db = drizzle(env.MOSHLY_DB);
  try {
    const clientIp = getClientIp(request);
    const retryAfter = await applyRateLimit(env.AUTH_KV, "register", `ip:${clientIp}`);
    if (retryAfter) return rateLimitedResponse(retryAfter);
    let email, password, name, inviteCode;
    try {
      ({ email, password, name, inviteCode } = await request.json());
    } catch {
      return new Response(JSON.stringify({ error: "Invalid request body" }), {
        status: 400,
        headers: { "Content-Type": "application/json" }
      });
    }
    if (!email || !password) {
      return new Response(JSON.stringify({ error: "Email and password are required" }), {
        status: 400,
        headers: { "Content-Type": "application/json" }
      });
    }
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return new Response(JSON.stringify({ error: "Invalid email format" }), {
        status: 400,
        headers: { "Content-Type": "application/json" }
      });
    }
    const passwordError = validatePassword(password);
    if (passwordError) {
      return new Response(JSON.stringify({ error: passwordError }), {
        status: 400,
        headers: { "Content-Type": "application/json" }
      });
    }
    let resolvedCode = null;
    if (inviteCode) {
      const normalizedCode = String(inviteCode).toUpperCase().trim();
      const codeRecord = await db.select().from(inviteCodes).where(eq(inviteCodes.code, normalizedCode)).get();
      if (!codeRecord) {
        return new Response(JSON.stringify({ error: "Invalid invite code" }), {
          status: 400,
          headers: { "Content-Type": "application/json" }
        });
      }
      if (codeRecord.expiresAt && codeRecord.expiresAt < /* @__PURE__ */ new Date()) {
        return new Response(JSON.stringify({ error: "This invite code has expired" }), {
          status: 400,
          headers: { "Content-Type": "application/json" }
        });
      }
      if (codeRecord.usesCount >= codeRecord.maxUses) {
        return new Response(JSON.stringify({ error: "This invite code has reached its maximum uses" }), {
          status: 400,
          headers: { "Content-Type": "application/json" }
        });
      }
      resolvedCode = codeRecord;
      const claimResult = await db.update(inviteCodes).set({ usesCount: sql`${inviteCodes.usesCount} + 1` }).where(and(
        eq(inviteCodes.code, normalizedCode),
        sql`uses_count < max_uses`
      )).run();
      if (!claimResult.meta.changes) {
        return new Response(JSON.stringify({ error: "This invite code has reached its maximum uses" }), {
          status: 400,
          headers: { "Content-Type": "application/json" }
        });
      }
    }
    const isGodTier = resolvedCode && GOD_TIER_PLANS.has(resolvedCode.plan);
    const subscriptionPlan = resolvedCode ? SUBSCRIPTION_PLANS.has(resolvedCode.plan) ? resolvedCode.plan : "major" : "free";
    const userRole = isGodTier ? "god" : "user";
    const limits = PLAN_LIMITS[subscriptionPlan];
    let subscriptionExpiresAt = null;
    if (resolvedCode?.durationMonths > 0) {
      subscriptionExpiresAt = /* @__PURE__ */ new Date();
      subscriptionExpiresAt.setMonth(subscriptionExpiresAt.getMonth() + resolvedCode.durationMonths);
    }
    const existing = await db.select({ id: users.id }).from(users).where(eq(users.email, email)).get();
    if (existing) {
      return new Response(JSON.stringify({
        success: true,
        message: "If this email is not already registered, a confirmation link has been sent to your inbox."
      }), {
        status: 201,
        headers: { "Content-Type": "application/json" }
      });
    }
    const passwordHash = await bcryptjs_default.hash(password, 10);
    const userId = crypto.randomUUID();
    const workspaceId = crypto.randomUUID();
    const slug = email.split("@")[0].toLowerCase() + "-" + crypto.randomUUID().substring(0, 6);
    const verificationToken = crypto.randomUUID();
    const verificationTokenHash = await sha256Hex2(verificationToken);
    const batchOps = [
      db.insert(users).values({
        id: userId,
        email,
        passwordHash,
        name,
        role: userRole,
        emailVerified: false,
        verificationToken: verificationTokenHash
      }),
      db.insert(workspaces).values({
        id: workspaceId,
        ownerId: userId,
        name: `${name || "My"}'s Workspace`,
        slug
      }),
      db.insert(subscriptions).values({
        workspaceId,
        plan: subscriptionPlan,
        pdfExportsLimit: limits.pdfExportsLimit,
        aiCreditsLimit: limits.aiCreditsLimit,
        expiresAt: subscriptionExpiresAt
      })
    ];
    await db.batch(batchOps);
    const apiKey = env.RESEND_API_KEY;
    const fromEmail = env.RESEND_FROM_EMAIL || "Moshly <hello@moshly.io>";
    if (apiKey) {
      try {
        const safeName = (name || "there").replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");
        const origin = new URL(request.url).origin;
        const confirmUrl = `${origin}/confirm.html?token=${verificationToken}`;
        const logoUrl = `${origin}/assets/Moshly-Main-Logo-1.svg`;
        await fetch("https://api.resend.com/emails", {
          method: "POST",
          headers: {
            "Authorization": `Bearer ${apiKey}`,
            "Content-Type": "application/json"
          },
          body: JSON.stringify({
            from: fromEmail,
            to: [email],
            subject: "Confirm your Moshly account",
            html: `
              <div style="margin:0;padding:32px 16px;background-color:#0E0F14;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Helvetica,Arial,sans-serif;">
                <div style="max-width:600px;margin:0 auto;background:#1B1E2E;border:1px solid #2D3048;border-radius:16px;overflow:hidden;box-shadow: 0 10px 25px -5px rgba(0, 0, 0, 0.3);">
                  <div style="padding:32px;text-align:center;border-bottom:1px solid #2D3048;background:#141624;">
                    <img src="${logoUrl}" alt="Moshly" style="height:32px;margin-bottom:12px;" />
                  </div>
                  <div style="padding:40px 32px;">
                    <h2 style="margin:0 0 16px;font-size:24px;font-weight:700;color:#E6E7EB;line-height:1.3;text-align:center;">Welcome to Moshly!</h2>
                    <p style="margin:0 0 16px;font-size:16px;color:#A4A7B5;line-height:1.7;">
                      Hello ${safeName},
                    </p>
                    <p style="margin:0 0 24px;font-size:16px;color:#A4A7B5;line-height:1.7;">
                      Thanks for joining Moshly. Please confirm your email address to activate your account:
                    </p>
                    <div style="text-align:center;margin:32px 0;">
                      <a href="${confirmUrl}" style="display:inline-block;background-color:#6B5CFF;color:#FFFFFF;padding:14px 28px;text-decoration:none;border-radius:10px;font-weight:700;font-size:16px;box-shadow: 0 4px 12px rgba(107, 92, 255, 0.3);">Confirm Account</a>
                    </div>
                    <p style="margin:24px 0 0;font-size:14px;color:#7B7F93;line-height:1.6;text-align:center;">
                      If you didn't sign up for Moshly, you can safely ignore this email.
                    </p>
                  </div>
                  <div style="padding:24px 32px;border-top:1px solid #2D3048;background:#141624;text-align:center;">
                    <p style="margin:0;font-size:12px;color:#7B7F93;letter-spacing:0.02em;">
                      \xA9 2026 Moshly \xB7 <a href="${origin}" style="color:#6B5CFF;text-decoration:none;">moshly.io</a>
                    </p>
                  </div>
                </div>
              </div>
            `,
            text: `Welcome to Moshly!

Hello ${name || "there"},

Thanks for joining Moshly. Please confirm your email address to activate your account by visiting this link: ${confirmUrl}

If you didn't sign up for Moshly, you can safely ignore this email.

\xA9 2026 Moshly \xB7 moshly.io`
          })
        });
      } catch (emailError) {
        console.error("Failed to send verification email:", emailError);
      }
    }
    return new Response(JSON.stringify({
      success: true,
      message: "If this email is not already registered, a confirmation link has been sent to your inbox."
    }), {
      status: 201,
      headers: { "Content-Type": "application/json" }
    });
  } catch (error) {
    console.error("Registration error:", error);
    return new Response(JSON.stringify({ error: "Server error during registration" }), {
      status: 500,
      headers: { "Content-Type": "application/json" }
    });
  }
}
var onRequestOptions9;
var init_register = __esm({
  "api/register.js"() {
    init_functionsRoutes_0_4727514041666032();
    init_d1();
    init_schema();
    init_bcryptjs();
    init_drizzle_orm();
    init_rate_limit();
    init_password();
    init_cors();
    init_plans();
    __name(sha256Hex2, "sha256Hex");
    __name(onRequestPost7, "onRequestPost");
    onRequestOptions9 = /* @__PURE__ */ __name(({ request }) => corsOptionsResponse(request, "POST, OPTIONS"), "onRequestOptions");
  }
});

// api/reset-password.js
async function sha256Hex3(input) {
  const buffer = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(input));
  return Array.from(new Uint8Array(buffer)).map((b) => b.toString(16).padStart(2, "0")).join("");
}
async function onRequestPost8({ request, env }) {
  const db = drizzle(env.MOSHLY_DB);
  try {
    const clientIp = getClientIp(request);
    const retryAfter = await applyRateLimit(env.AUTH_KV, "reset-password", `ip:${clientIp}`);
    if (retryAfter) return rateLimitedResponse(retryAfter);
    let token, password;
    try {
      ({ token, password } = await request.json());
    } catch {
      return new Response(JSON.stringify({ error: "Invalid request body" }), {
        status: 400,
        headers: { "Content-Type": "application/json" }
      });
    }
    if (!token || !password) {
      return new Response(JSON.stringify({ error: "Token and password are required" }), {
        status: 400,
        headers: { "Content-Type": "application/json" }
      });
    }
    const passwordError = validatePassword(password);
    if (passwordError) {
      return new Response(JSON.stringify({ error: passwordError }), {
        status: 400,
        headers: { "Content-Type": "application/json" }
      });
    }
    const tokenHash = await sha256Hex3(token);
    const existing = await db.select({ id: users.id }).from(users).where(
      and(
        eq(users.resetToken, tokenHash),
        gt(users.resetExpires, /* @__PURE__ */ new Date())
      )
    ).get();
    if (!existing) {
      return new Response(JSON.stringify({ error: "Invalid or expired reset token" }), {
        status: 400,
        headers: { "Content-Type": "application/json" }
      });
    }
    const passwordHash = await bcryptjs_default.hash(password, 10);
    const result = await db.update(users).set({
      passwordHash,
      resetToken: null,
      resetExpires: null
    }).where(
      and(
        eq(users.resetToken, tokenHash),
        gt(users.resetExpires, /* @__PURE__ */ new Date())
      )
    ).run();
    if (!result.meta?.changes || result.meta.changes === 0) {
      return new Response(JSON.stringify({ error: "Invalid or expired reset token" }), {
        status: 400,
        headers: { "Content-Type": "application/json" }
      });
    }
    if (env.AUTH_KV) {
      const activeRefreshToken = await env.AUTH_KV.get(`rt:user:${existing.id}`);
      if (activeRefreshToken) {
        await Promise.all([
          env.AUTH_KV.delete(`rt:${activeRefreshToken}`),
          env.AUTH_KV.delete(`rt:user:${existing.id}`)
        ]);
      }
    }
    return new Response(JSON.stringify({
      success: true,
      message: "Password reset successful"
    }), {
      status: 200,
      headers: { "Content-Type": "application/json" }
    });
  } catch (error) {
    console.error("Reset password error:", error.message);
    return new Response(JSON.stringify({ error: "Server error" }), {
      status: 500,
      headers: { "Content-Type": "application/json" }
    });
  }
}
var onRequestOptions10;
var init_reset_password = __esm({
  "api/reset-password.js"() {
    init_functionsRoutes_0_4727514041666032();
    init_d1();
    init_schema();
    init_drizzle_orm();
    init_bcryptjs();
    init_rate_limit();
    init_password();
    init_cors();
    __name(sha256Hex3, "sha256Hex");
    __name(onRequestPost8, "onRequestPost");
    onRequestOptions10 = /* @__PURE__ */ __name(({ request }) => corsOptionsResponse(request, "POST, OPTIONS"), "onRequestOptions");
  }
});

// api/verify-email.js
async function sha256Hex4(input) {
  const buffer = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(input));
  return Array.from(new Uint8Array(buffer)).map((b) => b.toString(16).padStart(2, "0")).join("");
}
async function onRequestPost9({ request, env }) {
  const db = drizzle(env.MOSHLY_DB);
  try {
    const { token } = await request.json();
    if (!token) {
      return new Response(JSON.stringify({ error: "Token is required" }), {
        status: 400,
        headers: { "Content-Type": "application/json" }
      });
    }
    const tokenHash = await sha256Hex4(token);
    const user = await db.select().from(users).where(eq(users.verificationToken, tokenHash)).get();
    if (!user) {
      return new Response(JSON.stringify({ error: "Invalid or expired verification token" }), {
        status: 400,
        headers: { "Content-Type": "application/json" }
      });
    }
    await db.update(users).set({
      emailVerified: true,
      verificationToken: null
    }).where(eq(users.id, user.id)).run();
    return new Response(JSON.stringify({
      success: true,
      message: "Email verified successfully. You can now log in."
    }), {
      status: 200,
      headers: { "Content-Type": "application/json" }
    });
  } catch (error) {
    console.error("Verification error:", error);
    return new Response(JSON.stringify({ error: "Server error during verification" }), {
      status: 500,
      headers: { "Content-Type": "application/json" }
    });
  }
}
var onRequestOptions11;
var init_verify_email = __esm({
  "api/verify-email.js"() {
    init_functionsRoutes_0_4727514041666032();
    init_d1();
    init_schema();
    init_drizzle_orm();
    init_cors();
    __name(sha256Hex4, "sha256Hex");
    __name(onRequestPost9, "onRequestPost");
    onRequestOptions11 = /* @__PURE__ */ __name(({ request }) => corsOptionsResponse(request, "POST, OPTIONS"), "onRequestOptions");
  }
});

// api/waitlist.js
function json4(data, status = 200, origin = "https://moshly.io") {
  return new Response(JSON.stringify(data), {
    status,
    headers: {
      "Content-Type": "application/json",
      "Access-Control-Allow-Origin": origin,
      "Access-Control-Allow-Methods": "POST, OPTIONS",
      "Access-Control-Allow-Headers": "Content-Type"
    }
  });
}
function isValidEmail2(email) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(String(email || "").trim());
}
async function resendRequest(path, apiKey, payload) {
  const response = await fetch(`${RESEND_API_BASE2}${path}`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json"
    },
    body: JSON.stringify(payload)
  });
  const result = await response.json().catch(() => ({}));
  return { response, result };
}
async function addToAudience(apiKey, audienceId, email, source) {
  if (!audienceId) return;
  const { response, result } = await resendRequest(
    `/audiences/${audienceId}/contacts`,
    apiKey,
    {
      email,
      unsubscribed: false,
      audienceId,
      properties: { source }
    }
  );
  if (response.ok || response.status === 409) {
    return;
  }
  throw new Error(result.message || result.error || "Unable to add contact to Resend audience");
}
async function sendEmail(apiKey, payload) {
  const { response, result } = await resendRequest("/emails", apiKey, payload);
  if (!response.ok) {
    throw new Error(result.message || result.error || "Unable to send email");
  }
}
function buildSubscriberEmailHtml() {
  return `
    <div style="margin:0;padding:32px 16px;background-color:#f3f5fb;">
      <div style="max-width:620px;margin:0 auto;background:#ffffff;border:1px solid #e7ebf4;border-radius:20px;overflow:hidden;">
        <div style="padding:20px 28px;background:linear-gradient(135deg,#0e0f14 0%,#15192a 100%);">
          <div style="font-family:Arial,sans-serif;font-size:12px;letter-spacing:0.18em;text-transform:uppercase;color:#98a2c7;">Moshly</div>
          <div style="margin-top:10px;font-family:Arial,sans-serif;font-size:28px;line-height:1.15;font-weight:700;color:#ffffff;">
            You're on the waitlist
          </div>
        </div>
        <div style="padding:32px 28px 18px 28px;font-family:Arial,sans-serif;color:#1f2937;">
          <p style="margin:0 0 16px 0;font-size:17px;line-height:1.65;">
            Thanks for joining us early. Your place on the Moshly waitlist is confirmed.
          </p>
          <p style="margin:0 0 24px 0;font-size:17px;line-height:1.65;color:#4b5563;">
            We're building a sharper home for artists, managers, and the people behind the scenes who keep music moving.
          </p>
          <div style="margin:0 0 24px 0;padding:20px;border-radius:16px;background:#f6f8fc;border:1px solid #e7ebf4;">
            <div style="font-size:12px;letter-spacing:0.12em;text-transform:uppercase;color:#6b7280;margin-bottom:12px;">What to expect</div>
            <div style="font-size:16px;line-height:1.7;color:#111827;">
              We'll keep you posted with launch news, early access updates, and the first invitation when Moshly goes live.
            </div>
          </div>
          <p style="margin:0 0 24px 0;font-size:15px;line-height:1.7;color:#6b7280;">
            No noise. Just the updates that matter, a clearer picture of what we're building, and, from time to time, maybe a few early perks along the way.
          </p>
          <a href="https://moshly.io" style="display:inline-block;padding:14px 22px;border-radius:999px;background:#6b5cff;color:#ffffff;text-decoration:none;font-size:15px;font-weight:700;">
            Visit Moshly
          </a>
        </div>
        <div style="padding:18px 28px 28px 28px;font-family:Arial,sans-serif;font-size:13px;line-height:1.7;color:#6b7280;">
          Questions? Reply to <a href="mailto:hello@moshly.io" style="color:#6b5cff;text-decoration:none;">hello@moshly.io</a>.
          <br />
          \xA9 2026 Moshly. All rights reserved.
        </div>
      </div>
    </div>
  `;
}
function buildSubscriberEmailText() {
  return [
    "You're on the Moshly waitlist.",
    "",
    "Thanks for joining us early. Your place on the Moshly waitlist is confirmed.",
    "",
    "We'll keep you posted with launch news, early access updates, and the first invitation when Moshly goes live.",
    "",
    "No noise. Just the updates that matter, a clearer picture of what we're building, and, from time to time, maybe a few early perks along the way.",
    "",
    "Visit Moshly: https://moshly.io",
    "Questions: hello@moshly.io"
  ].join("\n");
}
async function onRequestOptions12({ request }) {
  return json4({}, 204, getAllowedOrigin(request));
}
async function onRequestPost10({ request, env }) {
  const origin = getAllowedOrigin(request);
  try {
    const { email, source = "launching-soon" } = await request.json();
    const normalizedEmail = String(email || "").trim().toLowerCase();
    if (!isValidEmail2(normalizedEmail)) {
      return json4({ error: "Please enter a valid email address." }, 400, origin);
    }
    const apiKey = env.WAITLIST_API_KEY;
    const fromEmail = env.RESEND_FROM_EMAIL;
    const notifyTo = env.WAITLIST_NOTIFY_TO;
    const audienceId = env.RESEND_AUDIENCE_ID;
    if (!apiKey || !fromEmail || !notifyTo) {
      return json4({ error: "Waitlist email service is not configured yet." }, 500, origin);
    }
    await addToAudience(apiKey, audienceId, normalizedEmail, source);
    await sendEmail(apiKey, {
      from: fromEmail,
      to: [normalizedEmail],
      subject: "You're on the Moshly waitlist",
      html: buildSubscriberEmailHtml(),
      text: buildSubscriberEmailText()
    });
    await sendEmail(apiKey, {
      from: fromEmail,
      to: [notifyTo],
      subject: `New Moshly waitlist signup: ${normalizedEmail}`,
      html: `
        <div style="font-family:Inter,Arial,sans-serif;line-height:1.6;color:#111827;">
          <p>A new waitlist signup was received.</p>
          <p><strong>Email:</strong> ${normalizedEmail}</p>
          <p><strong>Source:</strong> ${source}</p>
          <p><strong>Time:</strong> ${(/* @__PURE__ */ new Date()).toISOString()}</p>
        </div>
      `,
      text: `New waitlist signup
Email: ${normalizedEmail}
Source: ${source}
Time: ${(/* @__PURE__ */ new Date()).toISOString()}`
    });
    return json4({ success: true }, 200, origin);
  } catch (error) {
    console.error("Waitlist signup error:", error);
    return json4({ error: "Could not add you to the waitlist right now." }, 500, origin);
  }
}
var RESEND_API_BASE2;
var init_waitlist = __esm({
  "api/waitlist.js"() {
    init_functionsRoutes_0_4727514041666032();
    init_cors();
    RESEND_API_BASE2 = "https://api.resend.com";
    __name(json4, "json");
    __name(isValidEmail2, "isValidEmail");
    __name(resendRequest, "resendRequest");
    __name(addToAudience, "addToAudience");
    __name(sendEmail, "sendEmail");
    __name(buildSubscriberEmailHtml, "buildSubscriberEmailHtml");
    __name(buildSubscriberEmailText, "buildSubscriberEmailText");
    __name(onRequestOptions12, "onRequestOptions");
    __name(onRequestPost10, "onRequestPost");
  }
});

// _middleware.js
function serveAsset(env, originalRequest, assetPath) {
  const origin = new URL(originalRequest.url).origin;
  const targetUrl = new URL(assetPath, origin).toString();
  return env.ASSETS.fetch(new Request(targetUrl, originalRequest));
}
function normalisePath(pathname) {
  if (pathname !== "/" && pathname.endsWith("/")) {
    return pathname.slice(0, -1);
  }
  return pathname;
}
async function onRequest({ request, next, env }) {
  const url = new URL(request.url);
  const pathname = normalisePath(url.pathname);
  if (pathname.startsWith("/api/")) {
    return next();
  }
  if (pathname === "/dashboard" || pathname === "/admin" || pathname === "/login" || pathname === "/signup") {
    return next();
  }
  if (pathname === "/") {
    const isPreLaunch = /* @__PURE__ */ new Date() < LAUNCH_DATE;
    if (isPreLaunch) {
      return serveAsset(env, request, "/launching-soon/index.html");
    }
    return next();
  }
  return next();
}
var LAUNCH_DATE;
var init_middleware = __esm({
  "_middleware.js"() {
    init_functionsRoutes_0_4727514041666032();
    LAUNCH_DATE = /* @__PURE__ */ new Date("2025-05-01T00:00:00Z");
    __name(serveAsset, "serveAsset");
    __name(normalisePath, "normalisePath");
    __name(onRequest, "onRequest");
  }
});

// ../.wrangler/tmp/pages-qovW65/functionsRoutes-0.4727514041666032.mjs
var routes;
var init_functionsRoutes_0_4727514041666032 = __esm({
  "../.wrangler/tmp/pages-qovW65/functionsRoutes-0.4727514041666032.mjs"() {
    init_code();
    init_code();
    init_invite_codes();
    init_invite_codes();
    init_invite_codes();
    init_contact();
    init_contact();
    init_forgot_password();
    init_forgot_password();
    init_login();
    init_login();
    init_logout();
    init_logout();
    init_me();
    init_me();
    init_me();
    init_me();
    init_refresh();
    init_refresh();
    init_register();
    init_register();
    init_reset_password();
    init_reset_password();
    init_verify_email();
    init_verify_email();
    init_waitlist();
    init_waitlist();
    init_middleware();
    routes = [
      {
        routePath: "/api/admin/invite-codes/:code",
        mountPath: "/api/admin/invite-codes",
        method: "DELETE",
        middlewares: [],
        modules: [onRequestDelete]
      },
      {
        routePath: "/api/admin/invite-codes/:code",
        mountPath: "/api/admin/invite-codes",
        method: "OPTIONS",
        middlewares: [],
        modules: [onRequestOptions]
      },
      {
        routePath: "/api/admin/invite-codes",
        mountPath: "/api/admin",
        method: "GET",
        middlewares: [],
        modules: [onRequestGet]
      },
      {
        routePath: "/api/admin/invite-codes",
        mountPath: "/api/admin",
        method: "OPTIONS",
        middlewares: [],
        modules: [onRequestOptions2]
      },
      {
        routePath: "/api/admin/invite-codes",
        mountPath: "/api/admin",
        method: "POST",
        middlewares: [],
        modules: [onRequestPost]
      },
      {
        routePath: "/api/contact",
        mountPath: "/api",
        method: "OPTIONS",
        middlewares: [],
        modules: [onRequestOptions3]
      },
      {
        routePath: "/api/contact",
        mountPath: "/api",
        method: "POST",
        middlewares: [],
        modules: [onRequestPost2]
      },
      {
        routePath: "/api/forgot-password",
        mountPath: "/api",
        method: "OPTIONS",
        middlewares: [],
        modules: [onRequestOptions4]
      },
      {
        routePath: "/api/forgot-password",
        mountPath: "/api",
        method: "POST",
        middlewares: [],
        modules: [onRequestPost3]
      },
      {
        routePath: "/api/login",
        mountPath: "/api",
        method: "OPTIONS",
        middlewares: [],
        modules: [onRequestOptions5]
      },
      {
        routePath: "/api/login",
        mountPath: "/api",
        method: "POST",
        middlewares: [],
        modules: [onRequestPost4]
      },
      {
        routePath: "/api/logout",
        mountPath: "/api",
        method: "OPTIONS",
        middlewares: [],
        modules: [onRequestOptions6]
      },
      {
        routePath: "/api/logout",
        mountPath: "/api",
        method: "POST",
        middlewares: [],
        modules: [onRequestPost5]
      },
      {
        routePath: "/api/me",
        mountPath: "/api",
        method: "DELETE",
        middlewares: [],
        modules: [onRequestDelete2]
      },
      {
        routePath: "/api/me",
        mountPath: "/api",
        method: "GET",
        middlewares: [],
        modules: [onRequestGet2]
      },
      {
        routePath: "/api/me",
        mountPath: "/api",
        method: "OPTIONS",
        middlewares: [],
        modules: [onRequestOptions7]
      },
      {
        routePath: "/api/me",
        mountPath: "/api",
        method: "PATCH",
        middlewares: [],
        modules: [onRequestPatch]
      },
      {
        routePath: "/api/refresh",
        mountPath: "/api",
        method: "OPTIONS",
        middlewares: [],
        modules: [onRequestOptions8]
      },
      {
        routePath: "/api/refresh",
        mountPath: "/api",
        method: "POST",
        middlewares: [],
        modules: [onRequestPost6]
      },
      {
        routePath: "/api/register",
        mountPath: "/api",
        method: "OPTIONS",
        middlewares: [],
        modules: [onRequestOptions9]
      },
      {
        routePath: "/api/register",
        mountPath: "/api",
        method: "POST",
        middlewares: [],
        modules: [onRequestPost7]
      },
      {
        routePath: "/api/reset-password",
        mountPath: "/api",
        method: "OPTIONS",
        middlewares: [],
        modules: [onRequestOptions10]
      },
      {
        routePath: "/api/reset-password",
        mountPath: "/api",
        method: "POST",
        middlewares: [],
        modules: [onRequestPost8]
      },
      {
        routePath: "/api/verify-email",
        mountPath: "/api",
        method: "OPTIONS",
        middlewares: [],
        modules: [onRequestOptions11]
      },
      {
        routePath: "/api/verify-email",
        mountPath: "/api",
        method: "POST",
        middlewares: [],
        modules: [onRequestPost9]
      },
      {
        routePath: "/api/waitlist",
        mountPath: "/api",
        method: "OPTIONS",
        middlewares: [],
        modules: [onRequestOptions12]
      },
      {
        routePath: "/api/waitlist",
        mountPath: "/api",
        method: "POST",
        middlewares: [],
        modules: [onRequestPost10]
      },
      {
        routePath: "/",
        mountPath: "/",
        method: "",
        middlewares: [onRequest],
        modules: []
      }
    ];
  }
});

// ../node_modules/wrangler/templates/pages-template-worker.ts
init_functionsRoutes_0_4727514041666032();

// ../node_modules/wrangler/node_modules/path-to-regexp/dist.es2015/index.js
init_functionsRoutes_0_4727514041666032();
function lexer(str) {
  var tokens = [];
  var i = 0;
  while (i < str.length) {
    var char = str[i];
    if (char === "*" || char === "+" || char === "?") {
      tokens.push({ type: "MODIFIER", index: i, value: str[i++] });
      continue;
    }
    if (char === "\\") {
      tokens.push({ type: "ESCAPED_CHAR", index: i++, value: str[i++] });
      continue;
    }
    if (char === "{") {
      tokens.push({ type: "OPEN", index: i, value: str[i++] });
      continue;
    }
    if (char === "}") {
      tokens.push({ type: "CLOSE", index: i, value: str[i++] });
      continue;
    }
    if (char === ":") {
      var name = "";
      var j = i + 1;
      while (j < str.length) {
        var code = str.charCodeAt(j);
        if (
          // `0-9`
          code >= 48 && code <= 57 || // `A-Z`
          code >= 65 && code <= 90 || // `a-z`
          code >= 97 && code <= 122 || // `_`
          code === 95
        ) {
          name += str[j++];
          continue;
        }
        break;
      }
      if (!name)
        throw new TypeError("Missing parameter name at ".concat(i));
      tokens.push({ type: "NAME", index: i, value: name });
      i = j;
      continue;
    }
    if (char === "(") {
      var count = 1;
      var pattern = "";
      var j = i + 1;
      if (str[j] === "?") {
        throw new TypeError('Pattern cannot start with "?" at '.concat(j));
      }
      while (j < str.length) {
        if (str[j] === "\\") {
          pattern += str[j++] + str[j++];
          continue;
        }
        if (str[j] === ")") {
          count--;
          if (count === 0) {
            j++;
            break;
          }
        } else if (str[j] === "(") {
          count++;
          if (str[j + 1] !== "?") {
            throw new TypeError("Capturing groups are not allowed at ".concat(j));
          }
        }
        pattern += str[j++];
      }
      if (count)
        throw new TypeError("Unbalanced pattern at ".concat(i));
      if (!pattern)
        throw new TypeError("Missing pattern at ".concat(i));
      tokens.push({ type: "PATTERN", index: i, value: pattern });
      i = j;
      continue;
    }
    tokens.push({ type: "CHAR", index: i, value: str[i++] });
  }
  tokens.push({ type: "END", index: i, value: "" });
  return tokens;
}
__name(lexer, "lexer");
function parse(str, options) {
  if (options === void 0) {
    options = {};
  }
  var tokens = lexer(str);
  var _a = options.prefixes, prefixes = _a === void 0 ? "./" : _a, _b = options.delimiter, delimiter = _b === void 0 ? "/#?" : _b;
  var result = [];
  var key = 0;
  var i = 0;
  var path = "";
  var tryConsume = /* @__PURE__ */ __name(function(type) {
    if (i < tokens.length && tokens[i].type === type)
      return tokens[i++].value;
  }, "tryConsume");
  var mustConsume = /* @__PURE__ */ __name(function(type) {
    var value2 = tryConsume(type);
    if (value2 !== void 0)
      return value2;
    var _a2 = tokens[i], nextType = _a2.type, index2 = _a2.index;
    throw new TypeError("Unexpected ".concat(nextType, " at ").concat(index2, ", expected ").concat(type));
  }, "mustConsume");
  var consumeText = /* @__PURE__ */ __name(function() {
    var result2 = "";
    var value2;
    while (value2 = tryConsume("CHAR") || tryConsume("ESCAPED_CHAR")) {
      result2 += value2;
    }
    return result2;
  }, "consumeText");
  var isSafe = /* @__PURE__ */ __name(function(value2) {
    for (var _i = 0, delimiter_1 = delimiter; _i < delimiter_1.length; _i++) {
      var char2 = delimiter_1[_i];
      if (value2.indexOf(char2) > -1)
        return true;
    }
    return false;
  }, "isSafe");
  var safePattern = /* @__PURE__ */ __name(function(prefix2) {
    var prev = result[result.length - 1];
    var prevText = prefix2 || (prev && typeof prev === "string" ? prev : "");
    if (prev && !prevText) {
      throw new TypeError('Must have text between two parameters, missing text after "'.concat(prev.name, '"'));
    }
    if (!prevText || isSafe(prevText))
      return "[^".concat(escapeString(delimiter), "]+?");
    return "(?:(?!".concat(escapeString(prevText), ")[^").concat(escapeString(delimiter), "])+?");
  }, "safePattern");
  while (i < tokens.length) {
    var char = tryConsume("CHAR");
    var name = tryConsume("NAME");
    var pattern = tryConsume("PATTERN");
    if (name || pattern) {
      var prefix = char || "";
      if (prefixes.indexOf(prefix) === -1) {
        path += prefix;
        prefix = "";
      }
      if (path) {
        result.push(path);
        path = "";
      }
      result.push({
        name: name || key++,
        prefix,
        suffix: "",
        pattern: pattern || safePattern(prefix),
        modifier: tryConsume("MODIFIER") || ""
      });
      continue;
    }
    var value = char || tryConsume("ESCAPED_CHAR");
    if (value) {
      path += value;
      continue;
    }
    if (path) {
      result.push(path);
      path = "";
    }
    var open = tryConsume("OPEN");
    if (open) {
      var prefix = consumeText();
      var name_1 = tryConsume("NAME") || "";
      var pattern_1 = tryConsume("PATTERN") || "";
      var suffix = consumeText();
      mustConsume("CLOSE");
      result.push({
        name: name_1 || (pattern_1 ? key++ : ""),
        pattern: name_1 && !pattern_1 ? safePattern(prefix) : pattern_1,
        prefix,
        suffix,
        modifier: tryConsume("MODIFIER") || ""
      });
      continue;
    }
    mustConsume("END");
  }
  return result;
}
__name(parse, "parse");
function match(str, options) {
  var keys = [];
  var re = pathToRegexp(str, keys, options);
  return regexpToFunction(re, keys, options);
}
__name(match, "match");
function regexpToFunction(re, keys, options) {
  if (options === void 0) {
    options = {};
  }
  var _a = options.decode, decode2 = _a === void 0 ? function(x) {
    return x;
  } : _a;
  return function(pathname) {
    var m = re.exec(pathname);
    if (!m)
      return false;
    var path = m[0], index2 = m.index;
    var params = /* @__PURE__ */ Object.create(null);
    var _loop_1 = /* @__PURE__ */ __name(function(i2) {
      if (m[i2] === void 0)
        return "continue";
      var key = keys[i2 - 1];
      if (key.modifier === "*" || key.modifier === "+") {
        params[key.name] = m[i2].split(key.prefix + key.suffix).map(function(value) {
          return decode2(value, key);
        });
      } else {
        params[key.name] = decode2(m[i2], key);
      }
    }, "_loop_1");
    for (var i = 1; i < m.length; i++) {
      _loop_1(i);
    }
    return { path, index: index2, params };
  };
}
__name(regexpToFunction, "regexpToFunction");
function escapeString(str) {
  return str.replace(/([.+*?=^!:${}()[\]|/\\])/g, "\\$1");
}
__name(escapeString, "escapeString");
function flags(options) {
  return options && options.sensitive ? "" : "i";
}
__name(flags, "flags");
function regexpToRegexp(path, keys) {
  if (!keys)
    return path;
  var groupsRegex = /\((?:\?<(.*?)>)?(?!\?)/g;
  var index2 = 0;
  var execResult = groupsRegex.exec(path.source);
  while (execResult) {
    keys.push({
      // Use parenthesized substring match if available, index otherwise
      name: execResult[1] || index2++,
      prefix: "",
      suffix: "",
      modifier: "",
      pattern: ""
    });
    execResult = groupsRegex.exec(path.source);
  }
  return path;
}
__name(regexpToRegexp, "regexpToRegexp");
function arrayToRegexp(paths, keys, options) {
  var parts = paths.map(function(path) {
    return pathToRegexp(path, keys, options).source;
  });
  return new RegExp("(?:".concat(parts.join("|"), ")"), flags(options));
}
__name(arrayToRegexp, "arrayToRegexp");
function stringToRegexp(path, keys, options) {
  return tokensToRegexp(parse(path, options), keys, options);
}
__name(stringToRegexp, "stringToRegexp");
function tokensToRegexp(tokens, keys, options) {
  if (options === void 0) {
    options = {};
  }
  var _a = options.strict, strict = _a === void 0 ? false : _a, _b = options.start, start = _b === void 0 ? true : _b, _c = options.end, end = _c === void 0 ? true : _c, _d = options.encode, encode3 = _d === void 0 ? function(x) {
    return x;
  } : _d, _e = options.delimiter, delimiter = _e === void 0 ? "/#?" : _e, _f = options.endsWith, endsWith = _f === void 0 ? "" : _f;
  var endsWithRe = "[".concat(escapeString(endsWith), "]|$");
  var delimiterRe = "[".concat(escapeString(delimiter), "]");
  var route = start ? "^" : "";
  for (var _i = 0, tokens_1 = tokens; _i < tokens_1.length; _i++) {
    var token = tokens_1[_i];
    if (typeof token === "string") {
      route += escapeString(encode3(token));
    } else {
      var prefix = escapeString(encode3(token.prefix));
      var suffix = escapeString(encode3(token.suffix));
      if (token.pattern) {
        if (keys)
          keys.push(token);
        if (prefix || suffix) {
          if (token.modifier === "+" || token.modifier === "*") {
            var mod = token.modifier === "*" ? "?" : "";
            route += "(?:".concat(prefix, "((?:").concat(token.pattern, ")(?:").concat(suffix).concat(prefix, "(?:").concat(token.pattern, "))*)").concat(suffix, ")").concat(mod);
          } else {
            route += "(?:".concat(prefix, "(").concat(token.pattern, ")").concat(suffix, ")").concat(token.modifier);
          }
        } else {
          if (token.modifier === "+" || token.modifier === "*") {
            throw new TypeError('Can not repeat "'.concat(token.name, '" without a prefix and suffix'));
          }
          route += "(".concat(token.pattern, ")").concat(token.modifier);
        }
      } else {
        route += "(?:".concat(prefix).concat(suffix, ")").concat(token.modifier);
      }
    }
  }
  if (end) {
    if (!strict)
      route += "".concat(delimiterRe, "?");
    route += !options.endsWith ? "$" : "(?=".concat(endsWithRe, ")");
  } else {
    var endToken = tokens[tokens.length - 1];
    var isEndDelimited = typeof endToken === "string" ? delimiterRe.indexOf(endToken[endToken.length - 1]) > -1 : endToken === void 0;
    if (!strict) {
      route += "(?:".concat(delimiterRe, "(?=").concat(endsWithRe, "))?");
    }
    if (!isEndDelimited) {
      route += "(?=".concat(delimiterRe, "|").concat(endsWithRe, ")");
    }
  }
  return new RegExp(route, flags(options));
}
__name(tokensToRegexp, "tokensToRegexp");
function pathToRegexp(path, keys, options) {
  if (path instanceof RegExp)
    return regexpToRegexp(path, keys);
  if (Array.isArray(path))
    return arrayToRegexp(path, keys, options);
  return stringToRegexp(path, keys, options);
}
__name(pathToRegexp, "pathToRegexp");

// ../node_modules/wrangler/templates/pages-template-worker.ts
var escapeRegex = /[.+?^${}()|[\]\\]/g;
function* executeRequest(request) {
  const requestPath = new URL(request.url).pathname;
  for (const route of [...routes].reverse()) {
    if (route.method && route.method !== request.method) {
      continue;
    }
    const routeMatcher = match(route.routePath.replace(escapeRegex, "\\$&"), {
      end: false
    });
    const mountMatcher = match(route.mountPath.replace(escapeRegex, "\\$&"), {
      end: false
    });
    const matchResult = routeMatcher(requestPath);
    const mountMatchResult = mountMatcher(requestPath);
    if (matchResult && mountMatchResult) {
      for (const handler of route.middlewares.flat()) {
        yield {
          handler,
          params: matchResult.params,
          path: mountMatchResult.path
        };
      }
    }
  }
  for (const route of routes) {
    if (route.method && route.method !== request.method) {
      continue;
    }
    const routeMatcher = match(route.routePath.replace(escapeRegex, "\\$&"), {
      end: true
    });
    const mountMatcher = match(route.mountPath.replace(escapeRegex, "\\$&"), {
      end: false
    });
    const matchResult = routeMatcher(requestPath);
    const mountMatchResult = mountMatcher(requestPath);
    if (matchResult && mountMatchResult && route.modules.length) {
      for (const handler of route.modules.flat()) {
        yield {
          handler,
          params: matchResult.params,
          path: matchResult.path
        };
      }
      break;
    }
  }
}
__name(executeRequest, "executeRequest");
var pages_template_worker_default = {
  async fetch(originalRequest, env, workerContext) {
    let request = originalRequest;
    const handlerIterator = executeRequest(request);
    let data = {};
    let isFailOpen = false;
    const next = /* @__PURE__ */ __name(async (input, init) => {
      if (input !== void 0) {
        let url = input;
        if (typeof input === "string") {
          url = new URL(input, request.url).toString();
        }
        request = new Request(url, init);
      }
      const result = handlerIterator.next();
      if (result.done === false) {
        const { handler, params, path } = result.value;
        const context = {
          request: new Request(request.clone()),
          functionPath: path,
          next,
          params,
          get data() {
            return data;
          },
          set data(value) {
            if (typeof value !== "object" || value === null) {
              throw new Error("context.data must be an object");
            }
            data = value;
          },
          env,
          waitUntil: workerContext.waitUntil.bind(workerContext),
          passThroughOnException: /* @__PURE__ */ __name(() => {
            isFailOpen = true;
          }, "passThroughOnException")
        };
        const response = await handler(context);
        if (!(response instanceof Response)) {
          throw new Error("Your Pages function should return a Response");
        }
        return cloneResponse(response);
      } else if ("ASSETS") {
        const response = await env["ASSETS"].fetch(request);
        return cloneResponse(response);
      } else {
        const response = await fetch(request);
        return cloneResponse(response);
      }
    }, "next");
    try {
      return await next();
    } catch (error) {
      if (isFailOpen) {
        const response = await env["ASSETS"].fetch(request);
        return cloneResponse(response);
      }
      throw error;
    }
  }
};
var cloneResponse = /* @__PURE__ */ __name((response) => (
  // https://fetch.spec.whatwg.org/#null-body-status
  new Response(
    [101, 204, 205, 304].includes(response.status) ? null : response.body,
    response
  )
), "cloneResponse");
export {
  pages_template_worker_default as default
};

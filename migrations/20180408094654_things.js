
exports.up = function(knex, Promise) {
  return Promise.all([
    knex.schema.createTable('things', function(table) {
      table.increments('id').primary();
      table.string('thing');
      table.integer('price');
      table.integer('quantity');
      table.integer('frequency');
      table.dateTime('created');
      table.integer('user_id').unsigned().notNullable().references('id').inTable('users');
    }),
  ]);  
};

exports.down = function(knex, Promise) {
  return Promise.all([
    knex.schema.dropTable('things'),
  ]);
};

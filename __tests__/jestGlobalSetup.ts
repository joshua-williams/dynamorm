import db from './fixtures/db'

export default async function() {
  await db.createTables('DROP_IF_EXISTS');
  const model = db.model('Cookbooks')

  await model.fill({
    title: "Southern Savories",
    description: 'Southern Cookbook',
    author: 'dev@studiowebfx.com',
    image: ['logo.png']
  }).save();
  await model.set('title', 'Southern Smothered').save();
  await model.set('title', 'Southern Fried').save();
  await model.set('title', 'Southern Sweets').save();

}

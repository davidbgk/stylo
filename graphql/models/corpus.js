const mongoose = require('mongoose')
const Schema = mongoose.Schema

const CorpusArticleSchema = new Schema({
  article: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Article'
  },
  order: Number
})

const corpusSchema = new Schema({
  name: {
    type: String,
    required: true,
  },
  articles: [CorpusArticleSchema],
  metadata: {
    type: String,
    default: ''
  },
  workspace: {
    type: Schema.Types.ObjectId,
    ref: 'Workspace',
  },
  creator: {
    type: Schema.Types.ObjectId,
    ref: 'User'
  }
}, { timestamps: true })

module.exports = mongoose.model('Corpus', corpusSchema)
module.exports.schema = corpusSchema

const User = require('../models/user')

const isUser = require('../policies/isUser')
const isAdmin = require('../policies/isAdmin')
const Workspace = require('../models/workspace')
const Article = require('../models/article')
const Tag = require('../models/tag')

module.exports = {
  Mutation: {
    async createUser (_, { details: userInput }) {
      // check for user uniqueness
      const existingUser = await User.findOne({ email: userInput.email })
      if (existingUser) {
        throw new Error('User with this email already exists!')
      }
      // create a user
      const newUser = await User.create({
        email: userInput.email,
        username: userInput.username,
        displayName: userInput.displayName || userInput.username,
        institution: userInput.institution || null,
        firstName: userInput.firstName || null,
        lastName: userInput.lastName || null,
        password: userInput.password,
        authType: 'local',
      })
      await newUser.createDefaultArticle()
      return newUser
    },
    async addAcquintance (_, args, context) {
      const { userId } = isUser(args, context)

      let thisAcquintance = await User.findOne({ email: args.email })
      if (!thisAcquintance) {
        throw new Error('No user found with this email')
      }
      let thisUser = await User.findById(userId)
      if (!thisUser) {
        throw new Error('Unable to find user')
      }

      //Check if acquintance is the user itself
      if (thisAcquintance.id === userId) {
        throw new Error('Can not add yourself to acquintance')
      }

      //Check if acquintance is not already in array
      if (
        thisUser.acquintances
          .map((a) => a.toString())
          .includes(thisAcquintance.id)
      ) {
        throw new Error('Email is already an acquintance')
      }

      //If all clear, add to acquintance
      thisUser.acquintances.push(thisAcquintance)
      await thisUser.save()
      return thisUser.populate('acquintances').execPopulate()
    },
    async grantAccountAccess (_, args, context) {
      const { userId } = isUser(args, context)

      const thisUser = await User.findById(userId)
        .populate('acquintances')
        .populate({ path: 'permissions', populate: 'user' })

      const remoteUser = await User.findById(args.to)

      const existingsScope = thisUser.permissions.find(
        (p) => p.scope === 'user' && p.user._id == remoteUser.id
      )

      if (existingsScope) {
        throw new Error(
          `Account [id: ${args.to}] has already access to account [id: ${args.user}]`
        )
      }

      thisUser.permissions.push({
        scope: 'user',
        user: remoteUser.id,
        roles: ['access', 'read', 'write'],
      })

      return thisUser
        .save()
        .then((u) =>
          u.populate({ path: 'permissions', populate: 'user' }).execPopulate()
        )
    },
    async revokeAccountAccess (_, args, context) {
      const { userId } = isUser(args, context)

      const thisUser = await User.findById(userId)
        .populate('acquintances')
        .populate({ path: 'permissions', populate: 'user' })

      const remoteUser = await User.findById(args.to)

      const existingsScope = thisUser.permissions.find(
        (p) => p.scope === 'user' && p.user._id == remoteUser.id
      )

      if (!existingsScope) {
        throw new Error(
          `Account [id: ${args.to}] has no access to account [id: ${args.user}]`
        )
      }

      thisUser.permissions.pull(existingsScope)

      return thisUser.save()
    },

    async updateUser (_, args, context) {
      const { userId } = isUser(args, context)
      const { details } = args

      let thisUser = await User.findById(userId)
      if (!thisUser) {
        throw new Error('Unable to find user')
      }

      ['displayName', 'firstName', 'lastName', 'institution', 'yaml', 'zoteroToken'].forEach(field => {
        if (Object.hasOwn(details, field)) {
          /* eslint-disable security/detect-object-injection */
          thisUser.set(field, details[field])
        }
      })

      return thisUser.save()
    },
  },

  Query: {
    // only available for admins
    async users (_, args, { user }) {
      isAdmin({ user })

      return User.find()
    },

    async user (_root, _args, context) {
      return User.findById(context.user._id)
    },

    async getUser (_, { filter }, context) {
      isUser({ }, context)
      return User.findOne({ email: filter.email })
    },

    userGrantedAccess(_, args, context) {
      isUser(args, context)

      return User.findAccountAccessUsers(context.token._id)
    },
  },

  User: {
    async articles(user, { limit }) {
      await user.populate({
        path: 'articles',
        options: { limit },
        populate: { path: 'owner tags' }
      }).execPopulate()

      return user.articles
    },

    async acquintances(user, args, context) {
      return Promise.all(user.acquintances.map((contactId) => context.loaders.users.load(contactId)))
    },

    /**
     * @param user
     * @returns {Promise<void>}
     */
    async tags(user){
      return Tag.find({ owner: user._id }).lean()
    },

    async workspaces(user) {
      if (user?.admin === true) {
        return Workspace.find()
      }
      return Workspace.find({ 'members.user': user?._id })
    },

    async article (user, { id }) {
      return User.model('Article').findAndPopulateOneByOwners(id, user)
    },

    async addContact (user, { userId }) {
      if (user.id === userId) {
        throw new Error('You cannot add yourself as a contact!')
      }
      const contact = await User.findById(userId)
      if (!contact) {
        throw new Error(`No user found with this id: ${userId}`)
      }
      return User.findOneAndUpdate(
        { _id: user._id },
        { $push: { acquintances: contact._id } },
        { lean: true }
      )
    },

    async removeContact (user, { userId }) {
      const contact = await User.findById(userId)
      if (!contact) {
        throw new Error(`No user found with this id: ${userId}`)
      }
      return User.findOneAndUpdate(
        { _id: user._id },
        { $pull: { acquintances: contact._id } },
        { lean: true }
      )
    },

    async stats (user) {
      const contributedArticlesCount = (await Article.find({ contributors: { $elemMatch: { user: user._id } } })).length
      return {
        myArticlesCount: user.articles.length,
        contributedArticlesCount
      }
    }
  },
}

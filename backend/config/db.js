import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';
import mongoose from 'mongoose';
import db from '../database.js'; // Our local JSON database

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Load .env from the project root relative to this file to handle being run from subdirectories
dotenv.config({ path: path.resolve(__dirname, '../../.env'), override: true });

class MockQuery {
  constructor(promise, modelName) {
    this.promise = promise;
    this.modelName = modelName;
    this.sortCriteria = null;
  }
  sort(criteria) {
    this.sortCriteria = criteria;
    return this;
  }
  select() { return this; }
  lean() { return this; }
  then(onfulfilled, onrejected) {
    let p = this.promise;
    if (this.sortCriteria) {
      p = p.then(data => {
        if (!Array.isArray(data)) return data;
        const sorted = [...data];
        const [key, dir] = Object.entries(this.sortCriteria)[0];
        sorted.sort((a, b) => {
          let valA = a[key];
          let valB = b[key];
          
          // Handle ISO dates or string/numbers
          if (typeof valA === 'string' && !isNaN(Date.parse(valA))) {
            valA = new Date(valA);
            valB = new Date(valB);
          }
          
          if (valA < valB) return dir === -1 ? 1 : -1;
          if (valA > valB) return dir === -1 ? -1 : 1;
          return 0;
        });
        return sorted;
      });
    }
    return p.then(onfulfilled, onrejected);
  }
  catch(onrejected) {
    return this.promise.catch(onrejected);
  }
}

const getModelOps = (modelName) => {
  switch (modelName) {
    case 'User':
      return {
        get: () => db.getUsers(),
        save: (data) => db.saveUsers(data)
      };
    case 'Resource':
      return {
        get: () => db.getResources(),
        save: (data) => db.saveResources(data)
      };
    case 'Announcement':
      return {
        get: () => db.getAnnouncements(),
        save: (data) => db.saveAnnouncements(data)
      };
    case 'Leaderboard':
      return {
        get: () => db.getLeaderboard(),
        save: (data) => db.saveLeaderboard(data)
      };
    default:
      throw new Error(`Unknown model: ${modelName}`);
  }
};

const patchModel = (Model) => {
  const modelName = Model.modelName;
  const ops = getModelOps(modelName);

  const wrapDoc = (doc) => {
    if (!doc) return doc;
    if (Array.isArray(doc)) return doc.map(wrapDoc);
    
    const wrapped = Object.create(Model.prototype);
    Object.assign(wrapped, doc);
    
    wrapped.markModified = function(path) {
      this._modifiedPaths = this._modifiedPaths || [];
      if (!this._modifiedPaths.includes(path)) {
        this._modifiedPaths.push(path);
      }
    };
    
    wrapped.save = async function() {
      const allData = await ops.get();
      const idKey = this.id ? 'id' : '_id';
      const index = allData.findIndex(item => item[idKey] === this[idKey]);
      
      const cleanData = {};
      for (const key of Object.keys(this)) {
        if (!key.startsWith('_') && typeof this[key] !== 'function') {
          cleanData[key] = this[key];
        } else if (key === 'scores' || key === 'domains' || key === 'adminDomains') {
          cleanData[key] = this[key];
        }
      }
      
      if (index !== -1) {
        allData[index] = cleanData;
      } else {
        allData.push(cleanData);
      }
      await ops.save(allData);
      return this;
    };
    
    return wrapped;
  };

  Model.find = function(query = {}) {
    const p = (async () => {
      const data = await ops.get();
      const filtered = data.filter(item => {
        return Object.entries(query).every(([k, v]) => {
          if (v && typeof v === 'object' && v.hasOwnProperty('$in')) {
            return Array.isArray(v.$in) && v.$in.includes(item[k]);
          }
          return item[k] === v;
        });
      });
      return wrapDoc(filtered);
    })();
    return new MockQuery(p);
  };

  Model.findOne = function(query = {}) {
    const p = (async () => {
      const data = await ops.get();
      const found = data.find(item => {
        return Object.entries(query).every(([k, v]) => {
          if (v && typeof v === 'object' && v.hasOwnProperty('$in')) {
            return Array.isArray(v.$in) && v.$in.includes(item[k]);
          }
          return item[k] === v;
        });
      });
      return found ? wrapDoc(found) : null;
    })();
    return new MockQuery(p);
  };

  Model.create = async function(data) {
    const allData = await ops.get();
    const isArray = Array.isArray(data);
    const items = isArray ? data : [data];
    const created = [];
    
    for (const item of items) {
      const newDoc = {
        ...item,
        id: item.id || `${modelName.toLowerCase().substring(0, 3)}_${Date.now()}_${Math.random().toString(36).substr(2, 5)}`,
        createdAt: item.createdAt || new Date().toISOString()
      };
      allData.push(newDoc);
      created.push(newDoc);
    }
    
    await ops.save(allData);
    return isArray ? wrapDoc(created) : wrapDoc(created[0]);
  };

  Model.findOneAndUpdate = function(query, update, options = {}) {
    const p = (async () => {
      const data = await ops.get();
      const index = data.findIndex(item => {
        return Object.entries(query).every(([k, v]) => item[k] === v);
      });
      if (index === -1) return null;
      
      const original = data[index];
      const changes = update.$set || update;
      const updated = { ...original, ...changes };
      data[index] = updated;
      await ops.save(data);
      return wrapDoc(updated);
    })();
    return new MockQuery(p);
  };

  Model.findOneAndDelete = function(query) {
    const p = (async () => {
      const data = await ops.get();
      const index = data.findIndex(item => {
        return Object.entries(query).every(([k, v]) => item[k] === v);
      });
      if (index === -1) return null;
      
      const deleted = data.splice(index, 1)[0];
      await ops.save(data);
      return wrapDoc(deleted);
    })();
    return new MockQuery(p);
  };

  Model.countDocuments = function(query = {}) {
    const p = (async () => {
      const data = await ops.get();
      const filtered = data.filter(item => {
        return Object.entries(query).every(([k, v]) => item[k] === v);
      });
      return filtered.length;
    })();
    return new MockQuery(p);
  };

  Model.insertMany = async function(entries) {
    const allData = await ops.get();
    const wrapped = entries.map(item => ({
      ...item,
      id: item.id || `${modelName.toLowerCase().substring(0, 3)}_${Date.now()}_${Math.random().toString(36).substr(2, 5)}`,
      createdAt: item.createdAt || new Date().toISOString()
    }));
    allData.push(...wrapped);
    await ops.save(allData);
    return wrapDoc(wrapped);
  };

  Model.prototype.markModified = function(path) {
    this._modifiedPaths = this._modifiedPaths || [];
    if (!this._modifiedPaths.includes(path)) {
      this._modifiedPaths.push(path);
    }
  };
  
  Model.prototype.save = async function() {
    const allData = await ops.get();
    const idKey = this.id ? 'id' : '_id';
    const index = allData.findIndex(item => item[idKey] === this[idKey]);
    
    const cleanData = {};
    for (const key of Object.keys(this)) {
      if (!key.startsWith('_') && typeof this[key] !== 'function') {
        cleanData[key] = this[key];
      } else if (key === 'scores' || key === 'domains' || key === 'adminDomains') {
        cleanData[key] = this[key];
      }
    }
    
    if (index !== -1) {
      allData[index] = cleanData;
    } else {
      allData.push(cleanData);
    }
    await ops.save(allData);
    return this;
  };
};

const setupMongooseFallback = () => {
  const models = ['User', 'Resource', 'Announcement', 'Leaderboard'];
  models.forEach(name => {
    const Model = mongoose.models[name];
    if (Model) {
      patchModel(Model);
    }
  });
};

const connectDB = async () => {
  const uri = process.env.MONGO_URI;

  if (!uri || typeof uri !== 'string') {
    console.warn("==================================================");
    console.warn("MongoDB Warning: MONGO_URI environment variable is not defined or is invalid.");
    console.warn("FALLING BACK TO LOCAL JSON DATABASE (db.json)!");
    console.warn("==================================================");
    setupMongooseFallback();
    return;
  }

  try {
    console.log("Connecting to MongoDB...");
    await mongoose.connect(uri, {
      serverSelectionTimeoutMS: 3000 // Fast timeout to trigger local fallback immediately if offline
    });
    console.log("MongoDB Connected Successfully");
  } catch (error) {
    console.warn("==================================================");
    console.warn("MongoDB Connection Error:", error.message);
    console.warn("FALLING BACK TO LOCAL JSON DATABASE (db.json)!");
    console.warn("==================================================");
    setupMongooseFallback();
  }
};

export default connectDB;
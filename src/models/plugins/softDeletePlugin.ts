import { Schema } from 'mongoose';

export interface SoftDeleteOptions {
  includeDeleted?: boolean;
}

export function softDeletePlugin(schema: Schema) {
  // Add soft-delete fields
  schema.add({
    isDeleted: {
      type: Boolean,
      default: false,
      index: true,
    },
    deletedAt: {
      type: Date,
      default: null,
    },
  });

  // Query hook: filter out soft-deleted documents by default
  const applySoftDeleteFilter = function (this: any) {
    const options = this.getOptions();
    if (!options?.includeDeleted) {
      this.where({ isDeleted: false });
    }
  };

  schema.pre('find', applySoftDeleteFilter);
  schema.pre('findOne', applySoftDeleteFilter);
  schema.pre('countDocuments', applySoftDeleteFilter);
  // @ts-expect-error Mongoose 9.11 findAndCount support
  schema.pre('findAndCount', applySoftDeleteFilter);

  // Instance method for soft delete
  schema.methods.softDelete = async function (this: any) {
    this.isDeleted = true;
    this.deletedAt = new Date();
    return this.save();
  };

  // Instance method for restoring soft-deleted doc
  schema.methods.restore = async function (this: any) {
    this.isDeleted = false;
    this.deletedAt = null;
    return this.save();
  };

  // Clean JSON and Object transforms: _id -> id and remove __v
  const transform = (_doc: any, ret: any) => {
    if (ret._id) {
      ret.id = ret._id.toString();
    }
    delete ret.__v;
    return ret;
  };

  schema.set('toJSON', {
    transform,
    virtuals: true,
  });

  schema.set('toObject', {
    transform,
    virtuals: true,
  });
}

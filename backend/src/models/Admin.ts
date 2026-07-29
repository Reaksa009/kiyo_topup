import { Schema, model, Document } from 'mongoose';

export interface IPermission extends Document {
  key: string;
  module: string;
  action: string;
  description: string;
}

const PermissionSchema = new Schema<IPermission>(
  {
    key: { type: String, required: true, unique: true },
    module: { type: String, required: true },
    action: { type: String, required: true },
    description: { type: String, required: true }
  },
  { timestamps: true }
);

export const Permission = model<IPermission>('Permission', PermissionSchema);

export interface IRole extends Document {
  name: string;
  description: string;
  permissions: string[]; // Permission keys e.g. ['games:read', 'orders:write']
  isSystem: boolean;
}

const RoleSchema = new Schema<IRole>(
  {
    name: { type: String, required: true, unique: true, trim: true },
    description: { type: String, default: '' },
    permissions: [{ type: String, required: true }],
    isSystem: { type: Boolean, default: false }
  },
  { timestamps: true }
);

export const Role = model<IRole>('Role', RoleSchema);

export interface IAdmin extends Document {
  name: string;
  email: string;
  passwordHash: string;
  roleId: Schema.Types.ObjectId;
  status: 'active' | 'inactive';
  lastLoginAt?: Date;
  createdAt: Date;
  updatedAt: Date;
}

const AdminSchema = new Schema<IAdmin>(
  {
    name: { type: String, required: true, trim: true },
    email: { type: String, required: true, unique: true, lowercase: true, trim: true },
    passwordHash: { type: String, required: true },
    roleId: { type: Schema.Types.ObjectId, ref: 'Role', required: true },
    status: { type: String, enum: ['active', 'inactive'], default: 'active' },
    lastLoginAt: { type: Date }
  },
  { timestamps: true }
);

export const Admin = model<IAdmin>('Admin', AdminSchema);

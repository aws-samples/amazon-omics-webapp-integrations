<script setup lang="ts">
import { defineExpose, ref, Ref } from 'vue';
import { QTableColumn, useQuasar } from 'quasar';
import { UserType } from '@aws-sdk/client-cognito-identity-provider';
import {
  listUsers,
  listGroups,
  adminListGroupsForUsers,
  addUserToGroup,
  deleteUser,
} from '../../api/cognito/cognito';
import { get, isEmpty, map } from 'lodash';

type UserList = {
  Username: string;
  UserStatus: string;
  Email: string;
  Group: string;
};
type AddUserGroupInput = {
  username: string;
  groupName: string;
};
let loading = ref(true);
let addUserGroupParams: AddUserGroupInput = {
  username: '',
  groupName: '',
};
let delUser = ref('');
const $q = useQuasar();
const model = ref(null);
const addGroupPopup = ref(false);
const deleteUserPopup = ref(false);
let rows: Ref<UserList[]> = ref([]);
let groupOptions = ref([]);
const columns: QTableColumn[] = [
  {
    name: 'Username',
    required: true,
    label: 'name',
    align: 'left',
    field: 'Username',
    sortable: true,
  },
  {
    name: 'UserStatus',
    required: true,
    label: 'status',
    align: 'left',
    field: 'UserStatus',
    sortable: true,
  },
  {
    name: 'Email',
    required: true,
    label: 'email',
    align: 'left',
    field: 'Email',
    sortable: true,
  },
  {
    name: 'Group',
    required: true,
    label: 'group',
    align: 'left',
    field: 'Group',
    sortable: true,
  },
];

const toast = (message: string, color: string) => {
  $q.notify({
    position: 'top',
    message: message,
    color: color,
  });
};

const getUsers = async () => {
  rows.value = [];
  const response = await listUsers();
  const usersInfo = await get(response, 'Users', []);
  if (!isEmpty(usersInfo)) {
    map(usersInfo, async (data: UserType) => {
      const res = await adminListGroupsForUsers(data.Username!);
      const groupName = await get(res, 'Groups[0].GroupName');
      rows.value.push({
        Username: data.Username!,
        UserStatus: data.UserStatus!,
        Email: getAttr(data.Attributes!, 'email'),
        Group: groupName,
      });
    });
  }
  loading.value = false;
  return [];
};
getUsers();

const getAttr = (attr: Array<any>, value: string) => {
  let email = '';
  map(attr, (val: any) => {
    if (val.Name === value) {
      email = val.Value;
    }
  });
  return email;
};
const groups = async () => {
  const response = await listGroups();
  const data = await get(response, 'Groups', []);
  let groupList;
  if (!isEmpty(data)) {
    const groups = map(data, 'GroupName');
    groupOptions.value = groups;
    groupList = groups;
  }
  return groupList;
};

const onDelete = (props: any) => {
  delUser.value = props.key;
  deleteUserPopup.value = true;
};
const addGroup = async (props: any) => {
  groups();
  addGroupPopup.value = true;
  addUserGroupParams.username = props.key;
};
const onSubmit = async () => {
  loading.value = true;
  addUserGroupParams.groupName = model.value!;
  const res = await addUserToGroup(addUserGroupParams);
  if (res.$metadata.httpStatusCode === 200) {
    loading.value = false;
    getUsers();
    addGroupPopup.value = false;
    toast('Success', 'green');
  } else {
    toast(`Error:${res}`, 'red');
  }
};
const onDeleteSubmit = async () => {
  loading.value = true;
  const res = await deleteUser(delUser.value);
  if (res.$metadata.httpStatusCode === 200) {
    loading.value = false;
    getUsers();
    deleteUserPopup.value = false;
    toast('Success', 'green');
  } else {
    toast('Error', 'red');
  }
};
defineExpose({
  getUsers,
});
</script>

<template>
  <div>
    <q-dialog v-model="addGroupPopup" persistent>
      <q-card style="min-width: 450px">
        <q-form @submit="onSubmit" class="q-gutter-md">
          <q-card-section>
            <div class="text-h6">Add group</div>
          </q-card-section>
          <q-card-section>
            <q-select v-model="model" :options="groupOptions" label="Group" />
          </q-card-section>

          <q-card-actions align="right" class="text-primary">
            <q-btn
              label="Submit"
              type="submit"
              color="primary"
              :loading="loading"
            />
            <q-btn label="Cancel" v-close-popup color="primary" />
          </q-card-actions>
        </q-form>
      </q-card>
    </q-dialog>
    <q-dialog v-model="deleteUserPopup" persistent>
      <q-card style="min-width: 450px">
        <q-form @submit="onDeleteSubmit" class="q-gutter-md">
          <q-card-section>
            <div class="text-h6">Delete user</div>
          </q-card-section>
          <q-card-section> Are you OK to delete {{ delUser }} </q-card-section>

          <q-card-actions align="right" class="text-primary">
            <q-btn
              label="Submit"
              type="submit"
              color="primary"
              :loading="loading"
            />
            <q-btn label="Cancel" v-close-popup color="primary" />
          </q-card-actions>
        </q-form>
      </q-card>
    </q-dialog>
    <q-table
      title="List User"
      title-class="text-h5 text-bold text-grey"
      row-key="Username"
      :rows="rows"
      :columns="columns"
      :loading="loading"
      dark
      color="amber"
    >
      <template v-slot:header="props">
        <q-tr :props="props">
          <q-th v-for="col in props.cols" :key="col.name" :props="props">
            {{ col.label }}
          </q-th>
          <q-th class="text-left">action </q-th>
        </q-tr>
      </template>
      <template v-slot:body="props">
        <q-tr :props="props">
          <q-td v-for="col in props.cols" :key="col.name" :props="props">
            {{ col.value }}
          </q-td>
          <q-td class="q-gutter-xs">
            <q-btn
              size="md"
              color="indigo-12"
              dense
              @click="addGroup(props)"
              icon="groups"
            />
            <q-btn
              size="md"
              color="pink"
              dense
              @click="onDelete(props)"
              icon="delete"
            />
          </q-td>
        </q-tr>
      </template>
    </q-table>
  </div>
</template>

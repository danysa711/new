// File: react/src/components/UserDataFilterContext.jsx

import React, { createContext, useContext, useState, useEffect } from 'react';
import { AuthContext } from '../context/AuthContext';

// Buat context baru untuk filter data user
export const UserDataFilterContext = createContext();

export const UserDataFilterProvider = ({ children }) => {
  const { user } = useContext(AuthContext);
  const [userId, setUserId] = useState(null);
  const [userRole, setUserRole] = useState(null);
  
  // Update userId dan userRole saat user berubah
  useEffect(() => {
    if (user) {
      setUserId(user.id);
      setUserRole(user.role);
    } else {
      setUserId(null);
      setUserRole(null);
    }
  }, [user]);
  
  // Helper function untuk menambahkan user_id ke parameter request
  const addUserIdToParams = (params = {}) => {
    // Jika user bukan admin, tambahkan user_id ke params
    if (userRole !== 'admin' && userId) {
      return { ...params, user_id: userId };
    }
    return params;
  };
  
  // Helper function untuk menambahkan user_id ke body request
  const addUserIdToBody = (body = {}) => {
    // Jika user bukan admin, tambahkan user_id ke body
    if (userRole !== 'admin' && userId) {
      return { ...body, user_id: userId };
    }
    return body;
  };
  
  // Helper function untuk memeriksa kepemilikan data
  const isOwnedByUser = (data) => {
    if (!data || !userId) return false;
    if (userRole === 'admin') return true; // Admin selalu punya akses
    return data.user_id === userId;
  };
  
  return (
    <UserDataFilterContext.Provider
      value={{
        userId,
        userRole,
        addUserIdToParams,
        addUserIdToBody,
        isOwnedByUser,
      }}
    >
      {children}
    </UserDataFilterContext.Provider>
  );
};

// Hook custom untuk menggunakan filter data user
export const useUserDataFilter = () => {
  const context = useContext(UserDataFilterContext);
  if (!context) {
    throw new Error('useUserDataFilter must be used within a UserDataFilterProvider');
  }
  return context;
};

// Contoh penggunaan dalam komponen:
// 
// import { useUserDataFilter } from '../components/UserDataFilterContext';
// 
// const MyComponent = () => {
//   const { addUserIdToParams, addUserIdToBody, isOwnedByUser } = useUserDataFilter();
// 
//   const fetchData = async () => {
//     const params = addUserIdToParams({ page: 1, limit: 10 });
//     const response = await axiosInstance.get('/api/data', { params });
//     return response.data;
//   };
// 
//   const createData = async (data) => {
//     const body = addUserIdToBody(data);
//     const response = await axiosInstance.post('/api/data', body);
//     return response.data;
//   };
// 
//   return (
//     <div>
//       {/* Komponen UI */}
//     </div>
//   );
// };
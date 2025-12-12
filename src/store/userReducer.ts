// User reducer for managing user details in Redux store

const initialState = {
  email: '',
  mobile: '',
  name: '',
  slug: '',
  is_company: '0',
};

const userReducer = (state = initialState, action: any) => {
  switch (action.type) {
    case 'SET_USER_DETAILS':
      return {
        ...state,
        ...action.payload,
      };
    case 'CLEAR_USER_DETAILS':
      return initialState;
    default:
      return state;
  }
};

export default userReducer;

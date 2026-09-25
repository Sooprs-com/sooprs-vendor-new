import AsyncStorage from "@react-native-async-storage/async-storage";
import { mobile_siteConfig } from "./mobile-siteConfig";


export async function postData(data: any, urlPath: string) {
  const isFormData = data instanceof FormData;
  return new Promise((resolve, reject) => {
    fetch(mobile_siteConfig.BASE_URL + urlPath, {
      method: 'POST',
      mode: 'cors',
      credentials: 'same-origin',
      headers: {
        ...(isFormData ? {} : {'Content-Type': 'application/json'}), // Only set Content-Type for non-FormData
        Origin: 'localhost',
        // authorization: 'Bearer ' + token,
      },
      body: isFormData ? data : JSON.stringify(data),
    })
      .then((response) => response.json())
      .then((json) => {
        if (json.response) {
          return resolve(json.response);
        } else {
          return resolve(json);
        }
      })
      .catch((error) => {
        reject(error);
      });
  });
}

export async function postDataWithToken(data: any, urlPath: string) {
  let token = await AsyncStorage.getItem(
    mobile_siteConfig.MOB_ACCESS_TOKEN_KEY
  );

  const isFormData = data instanceof FormData;
  return new Promise((resolve, reject) => {
    fetch(mobile_siteConfig.BASE_URL + urlPath, {
      method: "POST",
      mode: "cors",
      // cache: "no-cache",
      credentials: "same-origin",
      headers: {
        ...(isFormData ? {} : {"Content-Type": "application/json"}), // Only set Content-Type for non-FormData
        Origin: "localhost",
        authorization: "Bearer " + token,
      },
      body: isFormData ? data : JSON.stringify(data),
    })
      .then((response) => response.json())
      .then((json) => {
        resolve(json);
      })
      .catch((error) => {
        reject(error);
      });
  });
}

export async function postDataWithTokenBase2(data: any, urlPath: string) {
  let token = await AsyncStorage.getItem(
    mobile_siteConfig.MOB_ACCESS_TOKEN_KEY
  );

  const isFormData = data instanceof FormData;
  return new Promise((resolve, reject) => {
    fetch(mobile_siteConfig.BASE_URL2 + urlPath, {
      method: "POST",
      mode: "cors", 
      credentials: "same-origin",
      headers: {
        ...(isFormData ? {} : {"Content-Type": "application/json"}), // Only set Content-Type for non-FormData
        Origin: "localhost",
        authorization: "Bearer " + token,
      },
      body: isFormData ? data : JSON.stringify(data),
    })
      .then((response) => response.json())
      .then((json) => {
        resolve(json);
      })
      .catch((error) => {
        reject(error);
      });
  });
}

export async function postDataWithToken1(data: any, urlPath: string) {
  let token = await AsyncStorage.getItem(
    mobile_siteConfig.MOB_ACCESS_TOKEN_KEY
  );

  const isFormData = data instanceof FormData;
  return new Promise((resolve, reject) => {
    fetch(mobile_siteConfig.BASE_URL + urlPath, {
      method: "POST",
      mode: "cors",
      // cache: "no-cache",
      credentials: "same-origin",
      headers: {
        ...(isFormData ? {} : {"Content-Type": "application/json"}), // Only set Content-Type for non-FormData
        Origin: "localhost",
        authorization: "Bearer " + token,
      },
      body: isFormData ? data : JSON.stringify(data),
    })
      .then((response) => response.json())
      .then((json) => {
        resolve(json);
      })
      .catch((error) => {
        reject(error);
      });
  });
}

export async function getData(urlPath: string) {
  let accessTokenKey = await AsyncStorage.getItem(
    mobile_siteConfig.MOB_ACCESS_TOKEN_KEY
  );
  return new Promise((resolve, reject) => {
    fetch(mobile_siteConfig.BASE_URL + urlPath, {
      method: "GET",
      mode: "cors",
      // cache: "no-cache",
      credentials: "same-origin",
      headers: {
        "Content-Type": "application/json",
        Origin: "localhost",
        authorization: "Bearer " + accessTokenKey,
      },
    })
      .then((response) => response.json())
      .then((json) => resolve(json))
      .catch((error) => {
        reject(error);
      });
  });
}

export async function getDataWithToken(data: any, urlPath: string) {
  let token = await AsyncStorage.getItem(
    mobile_siteConfig.MOB_ACCESS_TOKEN_KEY
  );
  try {
    const res = await fetch(mobile_siteConfig.BASE_URL + urlPath, {
      method: "GET",
      mode: "cors",
      credentials: "same-origin",
      headers: {
        "Content-Type": "application/json",
        Origin: "localhost",
        Authorization: "Bearer " + token,
      },
    });
    return await res;
  } catch (err) {
  }
}

export async function patchData(data: any, urlPath: string) {
  try {
    const res = await fetch(mobile_siteConfig.BASE_URL + urlPath, {
      method: "PATCH",
      mode: "cors",
      // cache: "no-cache",
      credentials: "same-origin",
      headers: {
        "Content-Type": "application/json",
        Origin: "http://localhost:3000",
        authorization:
          "Bearer " +
          AsyncStorage.getItem(mobile_siteConfig.MOB_ACCESS_TOKEN_KEY),
      },
      body: JSON.stringify(data),
    });
    return await res;
  } catch (err) {
  }
}

export async function PutDataWithToken(data: any, urlPath: string) {
  let token = await AsyncStorage.getItem(mobile_siteConfig.MOB_ACCESS_TOKEN_KEY);

  return new Promise((resolve, reject) => {
    fetch(mobile_siteConfig.BASE_URL + urlPath, {
      method: 'PUT',
      // mode: 'cors',
      // cache: 'no-cache',
      credentials: 'same-origin',
      headers: {
        Accept: "*/*",
        "Content-Type": 'application/json',
        Authorization: 'Bearer ' + token,
      },
      body: JSON.stringify(data),
    })
      .then(response => response.json())
      .then(json => {
        // 
        resolve(json);
      })
      .catch(error => {
        reject(error);
      });
  });
}

export async function putDataWithTokenFormData(data: any, urlPath: string) {
  let token = await AsyncStorage.getItem(mobile_siteConfig.MOB_ACCESS_TOKEN_KEY);
  const isFormData = data instanceof FormData;
  return new Promise((resolve, reject) => {
    fetch(mobile_siteConfig.BASE_URL + urlPath, {
      method: "PUT",
      mode: "cors",
      credentials: "same-origin",
      headers: {
        ...(isFormData ? {} : {"Content-Type": "application/json"}), // Only set Content-Type for non-FormData
        Origin: "localhost",
        authorization: "Bearer " + token,
      },
      body: isFormData ? data : JSON.stringify(data),
    })
      .then((response) => response.json())
      .then((json) => {
        resolve(json);
      })
      .catch((error) => {
        reject(error);
      });
  });
}

export async function deleteDataWithToken(data: any, urlPath: string) {
  let token = await AsyncStorage.getItem(mobile_siteConfig.MOB_ACCESS_TOKEN_KEY);
  return new Promise((resolve, reject) => {
    fetch(mobile_siteConfig.BASE_URL + urlPath, {
      method: 'DELETE',
      mode: 'cors',
      credentials: 'same-origin',
      headers: {
        Accept: "*/*",
        "Content-Type": 'application/json',
        Authorization: 'Bearer ' + token,
      },
      body: JSON.stringify(data),
    })
      .then(response => response.json())
      .then(json => {
        resolve(json);
      })
      .catch(error => {
        reject(error);
      });
  });
}


// upload file on s3


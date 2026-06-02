// src/utils/localStorageHelper.js

/**
 * Save data to localStorage
 * @param {string} key
 * @param {any} value
 */
export const setItem = (key, value) => {
  try {
    const jsonValue = JSON.stringify(value);
    localStorage.setItem(key, jsonValue);
  } catch (error) {
    console.error(`Error saving to localStorage (key: ${key})`, error);
  }
};

/**
 * Get data from localStorage
 * @param {string} key
 * @param {any} defaultValue (optional)
 * @returns {any}
 */
export const getItem = (key, defaultValue = null) => {
  try {
    const item = localStorage.getItem(key);
    return item ? JSON.parse(item) : defaultValue;
  } catch (error) {
    console.error(`Error reading localStorage (key: ${key})`, error);
    return defaultValue;
  }
};

/**
 * Remove specific item
 * @param {string} key
 */
export const removeItem = (key) => {
  try {
    localStorage.removeItem(key);
  } catch (error) {
    console.error(`Error removing localStorage item (key: ${key})`, error);
  }
};

/**
 * Clear all localStorage
 */
/**
 * Clear all localStorage except protected keys
 */
const PROTECTED_KEYS = [
  "dashboard_walkthrough_done",
  "certificates_walkthrough_done",
  "transactions_walkthrough_done",
  "documents_walkthrough_done",
];

export const clearStorage = () => {
  try {
    Object.keys(localStorage)
      .filter((key) => !PROTECTED_KEYS.includes(key))
      .forEach((key) => localStorage.removeItem(key));
  } catch (error) {
    console.error("Error clearing localStorage", error);
  }
};
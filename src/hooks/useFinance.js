import { useState, useEffect, useCallback } from 'react';
import toast from 'react-hot-toast';

// Generic data fetching hook
export const useFetch = (fetchFn, deps = []) => {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetch = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetchFn();
      setData(res.data.data);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to load data');
    } finally {
      setLoading(false);
    }
  }, deps); // eslint-disable-line

  useEffect(() => { fetch(); }, [fetch]);

  return { data, loading, error, refetch: fetch };
};

// Modal state hook
export const useModal = (initial = false) => {
  const [isOpen, setIsOpen] = useState(initial);
  const [editItem, setEditItem] = useState(null);

  const open = useCallback((item = null) => {
    setEditItem(item);
    setIsOpen(true);
  }, []);

  const close = useCallback(() => {
    setEditItem(null);
    setIsOpen(false);
  }, []);

  return { isOpen, editItem, open, close };
};

// Form state hook
export const useForm = (initialValues) => {
  const [values, setValues] = useState(initialValues);
  const [errors, setErrors] = useState({});
  const [submitting, setSubmitting] = useState(false);

  const handleChange = useCallback((e) => {
    const { name, value, type, checked } = e.target;
    setValues(prev => ({ ...prev, [name]: type === 'checkbox' ? checked : value }));
    setErrors(prev => ({ ...prev, [name]: '' }));
  }, []);

  const reset = useCallback((vals = initialValues) => {
    setValues(vals);
    setErrors({});
  }, [initialValues]);

  const handleSubmit = useCallback((onSubmit) => async (e) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      await onSubmit(values);
    } catch (err) {
      const message = err.response?.data?.message || 'An error occurred';
      toast.error(message);
    } finally {
      setSubmitting(false);
    }
  }, [values]);

  return { values, errors, submitting, handleChange, handleSubmit, reset, setValues, setErrors };
};

// Current month/year hook
export const useCurrentPeriod = () => {
  const now = new Date();
  const [month, setMonth] = useState(now.getMonth() + 1);
  const [year, setYear] = useState(now.getFullYear());

  const prevMonth = () => {
    if (month === 1) { setMonth(12); setYear(y => y - 1); }
    else setMonth(m => m - 1);
  };

  const nextMonth = () => {
    if (month === 12) { setMonth(1); setYear(y => y + 1); }
    else setMonth(m => m + 1);
  };

  const monthName = new Date(year, month - 1).toLocaleString('en', { month: 'long' });

  return { month, year, monthName, prevMonth, nextMonth };
};

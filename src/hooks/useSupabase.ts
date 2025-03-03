import { useState, useEffect } from "react";
import { SupabaseClient } from "@/lib/api/supabase-client";

export function useUsers() {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const loadUsers = async () => {
    try {
      setLoading(true);
      const { data, error } = await SupabaseClient.getUsers();
      if (error) throw error;
      setUsers(data || []);
    } catch (err) {
      setError(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadUsers();
  }, []);

  return { users, loading, error, reload: loadUsers };
}

export function useClasses() {
  const [classes, setClasses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const loadClasses = async () => {
    try {
      setLoading(true);
      const { data, error } = await SupabaseClient.getClasses();
      if (error) throw error;
      setClasses(data || []);
    } catch (err) {
      setError(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadClasses();

    // Subscribe to realtime changes
    const subscription = SupabaseClient.subscribeToClasses(() => {
      loadClasses();
    });

    return () => {
      subscription.unsubscribe();
    };
  }, []);

  return { classes, loading, error, reload: loadClasses };
}

export function useEnrollments() {
  const [enrollments, setEnrollments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const loadEnrollments = async () => {
    try {
      setLoading(true);
      const { data, error } = await SupabaseClient.getEnrollments();
      if (error) throw error;
      setEnrollments(data || []);
    } catch (err) {
      setError(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadEnrollments();
  }, []);

  return { enrollments, loading, error, reload: loadEnrollments };
}

export function useAttendance() {
  const [records, setRecords] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const loadRecords = async () => {
    try {
      setLoading(true);
      const { data, error } = await SupabaseClient.getAttendanceRecords();
      if (error) throw error;
      setRecords(data || []);
    } catch (err) {
      setError(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadRecords();

    // Subscribe to realtime changes
    const subscription = SupabaseClient.subscribeToAttendance(() => {
      loadRecords();
    });

    return () => {
      subscription.unsubscribe();
    };
  }, []);

  return { records, loading, error, reload: loadRecords };
}

import { useState, useEffect } from "react";
import { supabase } from "@/lib/supabase";
import * as supabaseClient from "@/lib/api/supabase-client";

export function useSupabase() {
  return { supabase };
}

export function useUsers() {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const loadUsers = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase.from("users").select("*");
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
      const { data, error } = await supabase.from("classes").select("*");
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

    // Subscribe to realtime changes if needed
    const channel = supabase
      .channel("public:classes")
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "classes" },
        () => {
          loadClasses();
        },
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
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
      const { data, error } = await supabase
        .from("class_enrollments")
        .select("*");
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
      const { data, error } = await supabase
        .from("attendance_records")
        .select("*");
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

    // Subscribe to realtime changes if needed
    const channel = supabase
      .channel("public:attendance_records")
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "attendance_records" },
        () => {
          loadRecords();
        },
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  return { records, loading, error, reload: loadRecords };
}

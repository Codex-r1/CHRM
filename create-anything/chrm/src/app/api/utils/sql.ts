import { neon } from '@neondatabase/serverless';

// Create a simple wrapper for the Neon SQL function
const sql = process.env.DATABASE_URL 
  ? neon(process.env.DATABASE_URL) 
  : (() => {
      // Fallback function for development without DB
      const errorFn = () => {
        throw new Error(
          'No database connection string was provided to `neon()`. Perhaps process.env.DATABASE_URL has not been set'
        );
      };
      
      // Cast to any to avoid type issues
      const fn = errorFn as any;
      fn.transaction = errorFn;
      
      return fn;
    })();

export default sql;
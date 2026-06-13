DO $$
DECLARE
    r RECORD;
BEGIN
    -- Load age extension
    LOAD 'age';
    SET search_path = ag_catalog, "$user", public;
    
    FOR r IN SELECT id, name, entity_type, importance FROM public.entities LOOP
        BEGIN
            EXECUTE format('
                SELECT * FROM cypher(''worldstate'', $cmd$
                    MERGE (e:Entity {id: %L})
                    SET e.name = %L, e.type = %L, e.importance = %s
                $cmd$) as (v agtype);
            ', r.id::text, r.name, r.entity_type, r.importance::text);
        EXCEPTION WHEN OTHERS THEN
            RAISE NOTICE 'Could not sync entity % to graph: %', r.name, SQLERRM;
        END;
    END LOOP;
END;
$$;

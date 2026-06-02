-- Create function to get resident summary
CREATE OR REPLACE FUNCTION smart_barangay.get_resident_summary(resident_uuid uuid)
RETURNS jsonb AS $$
DECLARE
    resident_info jsonb;
    transactions_info jsonb;
    appointments_info jsonb;
BEGIN
    SELECT to_jsonb(r) - 'remarks' 
    INTO resident_info
    FROM smart_barangay.residents r
    WHERE r.id = resident_uuid;

    SELECT jsonb_agg(t ORDER BY t.timestamp DESC)
    INTO transactions_info
    FROM (
        SELECT *
        FROM smart_barangay.transaction
        WHERE resident_id = resident_uuid
        ORDER BY timestamp DESC
        LIMIT 9
    ) t;

    SELECT jsonb_agg(h ORDER BY h.appointment_date DESC)
    INTO appointments_info
    FROM (
        SELECT *
        FROM smart_barangay.health_appointments
        WHERE resident_id = resident_uuid
        ORDER BY appointment_date DESC
        LIMIT 9
    ) h;

    RETURN jsonb_build_object(
        'resident', resident_info,
        'latest_transactions', transactions_info,
        'latest_health_appointments', appointments_info
    );
END;
$$ LANGUAGE plpgsql;

import React, { use, useEffect } from 'react'

export default function page() {
    async function getPatient(patientId: string) {
        const res = await fetch('/api/patients/get', {
            method: 'GET',
            headers: {
                'patient-id': patientId,
            },
        });

        if (!res.ok) throw new Error('Failed to fetch patient');
        console.log("res", res);
        return await res.json();
    }

    useEffect(() => {
        const patientId = '1234567890123'; // Replace with actual patient ID
        getPatient(patientId)
            .then(data => console.log("Patient data:", data))
            .catch(error => console.error("Error fetching patient:", error));
    }, []);

    return (
        <div>page</div>
    )
}

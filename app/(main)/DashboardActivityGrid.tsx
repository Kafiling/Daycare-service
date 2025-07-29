"use client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Users, CalendarCheck, CalendarDays, Activity } from "lucide-react";
import { motion } from "framer-motion";
import { useState, useEffect } from "react";
import { getPatientGroups, getPatientsWithGroups } from "@/app/service/group-assignment";

interface PatientGroup {
  id: string;
  name: string;
  description?: string;
  color?: string;
  created_at: string;
  updated_at: string;
}

interface Patient {
  id: string;
  first_name: string;
  last_name: string;
  group_id?: string;
  group?: PatientGroup;
}

interface GroupWithPatients extends PatientGroup {
  patients: Patient[];
  patientCount: number;
}

// Animation variants
const containerVariants = {
	hidden: { opacity: 0 },
	show: {
		opacity: 1,
		transition: {
			staggerChildren: 0.1,
		},
	},
};

const cardVariants = {
	hidden: {
		opacity: 0,
		y: 20,
	},
	show: {
		opacity: 1,
		y: 0,
		transition: {
			duration: 0.4,
		},
	},
};

export function DashboardActivityGrid() {
	const [groups, setGroups] = useState<GroupWithPatients[]>([]);
	const [isLoading, setIsLoading] = useState(true);
	const [error, setError] = useState<string | null>(null);

	useEffect(() => {
		const loadGroupData = async () => {
			try {
				setIsLoading(true);
				setError(null);

				// Fetch both groups and patients with groups
				const [groupsData, patientsData] = await Promise.all([
					getPatientGroups(),
					getPatientsWithGroups()
				]);

				// Group patients by their group
				const groupsWithPatients: GroupWithPatients[] = groupsData.map(group => {
					const groupPatients = patientsData.filter(patient => patient.group_id === group.id);
					return {
						...group,
						patients: groupPatients,
						patientCount: groupPatients.length
					};
				});

				// Only show groups that have patients
				const groupsWithMembers = groupsWithPatients.filter(group => group.patientCount > 0);

				setGroups(groupsWithMembers);
			} catch (error) {
				console.error('Error loading group data:', error);
				setError('เกิดข้อผิดพลาดในการโหลดข้อมูลกลุ่ม');
			} finally {
				setIsLoading(false);
			}
		};

		loadGroupData();
	}, []);

	if (isLoading) {
		return (
			<div className="text-center py-8">
				<div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-pink-600"></div>
				<p className="mt-2 text-gray-600">กำลังโหลดข้อมูลกลุ่มผู้รับบริการ...</p>
			</div>
		);
	}

	if (error) {
		return (
			<div className="text-center py-8">
				<div className="text-red-500 mb-2">⚠️</div>
				<p className="text-red-600">{error}</p>
			</div>
		);
	}

	if (groups.length === 0) {
		return (
			<div className="text-center py-8">
				<Users className="h-16 w-16 text-gray-400 mx-auto mb-4" />
				<h3 className="text-lg font-semibold text-gray-600 mb-2">ยังไม่มีกลุ่มผู้รับบริการ</h3>
				<p className="text-gray-500">ระบบยังไม่พบกลุ่มผู้รับบริการที่มีสมาชิก</p>
			</div>
		);
	}

	return (
		<>
			<div className="flex items-center justify-between mb-6">
				<h2 className="text-2xl font-bold text-center">กลุ่มผู้รับบริการ</h2>
				<div className="text-sm text-gray-500">
					ทั้งหมด {groups.length} กลุ่ม
				</div>
			</div>
			<motion.div
				className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6"
				variants={containerVariants}
				initial="hidden"
				animate="show"
			>
				{groups.map((group, index) => (
					<motion.div key={group.id} variants={cardVariants}>
						<Card className="hover:shadow-md transition-shadow">
							<CardHeader>
								<CardTitle className="flex items-center justify-between">
									<div className="flex items-center gap-3">
										<div
											className="w-4 h-4 rounded-full"
											style={{ backgroundColor: group.color || '#6B7280' }}
										/>
										<span className="text-lg">{group.name}</span>
									</div>
									<span className="text-sm font-medium text-gray-500 bg-gray-100 px-2 py-1 rounded">
										{group.patientCount} คน
									</span>
								</CardTitle>
								{group.description && (
									<p className="text-sm text-gray-600 mt-2">
										{group.description}
									</p>
								)}
								<div className="flex items-center gap-2 text-sm text-gray-500 mt-2">
									<Activity className="h-4 w-4" />
									<span>
										สร้างเมื่อ: {new Date(group.created_at).toLocaleDateString("th-TH", {
											year: "numeric",
											month: "long",
											day: "numeric",
										})}
									</span>
								</div>
							</CardHeader>
							<CardContent>
								<div className="flex items-center gap-2 mb-4">
									<Users className="h-5 w-5" />
									<h3 className="text-lg font-semibold">สมาชิกในกลุ่ม</h3>
								</div>
								{group.patients.length > 0 ? (
									<ul className="space-y-2 max-h-40 overflow-y-auto">
										{group.patients.map((patient, i) => (
											<li key={patient.id} className="flex items-center">
												<span 
													className="h-2 w-2 rounded-full mr-3" 
													style={{ backgroundColor: group.color || '#6B7280' }}
												></span>
												<span className="text-sm">
													{patient.first_name} {patient.last_name}
												</span>
											</li>
										))}
									</ul>
								) : (
									<p className="text-gray-500 text-sm italic">ยังไม่มีสมาชิกในกลุ่ม</p>
								)}
							</CardContent>
						</Card>
					</motion.div>
				))}
			</motion.div>
		</>
	);
}

"use client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Users, CalendarCheck, CalendarDays } from "lucide-react";
import { motion } from "framer-motion";

// Sample data for events
const events = [
	{
		groupNumber: 1,
		eventName: "ตรวจสุขภาพประจำปี",
		rsvps: ["สมชาย เข็มกลัด", "สมหญิง ยิ่งสุข", "สมศักดิ์ รักชาติ", "สมศรี มีสุข"],
		nextEventDate: "2025-07-15",
	},
	{
		groupNumber: 2,
		eventName: "ตรวจสุขภาพฟัน",
		rsvps: ["อาทิตย์ แจ่มใส", "มานี ใจดี", "ปิติ ยินดี"],
		nextEventDate: "2025-07-20",
	},
	{
		groupNumber: 3,
		eventName: "ฉีดวัคซีน",
		rsvps: ["วีระพล สุขเสมอ", "มาลี มีลาภ", "ชาติชาย เชี่ยวชาญ", "พรทิพย์ งามดี"],
		nextEventDate: "2025-08-01",
	},
	{
		groupNumber: 4,
		eventName: "อบรมโภชนาการ",
		rsvps: ["อำนาจ เจริญสุข", "ทิพย์วรรณ ดีเสมอ", "จักรกฤษณ์ มั่นคง"],
		nextEventDate: "2025-08-10",
	},
];

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

export function DashboardGrid() {
	return (
		<motion.div
			className="grid grid-cols-1 md:grid-cols-2 gap-6"
			variants={containerVariants}
			initial="hidden"
			animate="show"
		>
			{events.map((event, index) => (
				<motion.div key={index} variants={cardVariants}>
					<Card>
						<CardHeader>
							<CardTitle className="flex items-center justify-between">
								<span className="flex items-center gap-2">
									<CalendarCheck className="h-5 w-5" />
									{event.eventName}
								</span>
								<span className="text-sm font-medium text-gray-500">
									กลุ่มที่ {event.groupNumber}
								</span>
							</CardTitle>
							<div className="flex items-center gap-2 text-sm text-gray-500 mt-2">
								<CalendarDays className="h-4 w-4" />
								<span>
									กิจกรรมครั้งถัดไป:{" "}
									{new Date(event.nextEventDate).toLocaleDateString("th-TH", {
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
								<h3 className="text-lg font-semibold">ผู้ป่วยที่ตอบรับ</h3>
							</div>
							<ul className="space-y-2">
								{event.rsvps.map((patient, i) => (
									<li key={i} className="flex items-center">
										<span className="h-2 w-2 rounded-full bg-pink-500 mr-2"></span>
										{patient}
									</li>
								))}
							</ul>
						</CardContent>
					</Card>
				</motion.div>
			))}
		</motion.div>
	);
}

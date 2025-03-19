"use client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Users, Clock, UserCog, AlertCircle, Building2 } from "lucide-react";
import {
  AreaChart,
  Area,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
} from "recharts";
import { motion } from "framer-motion";

// Sample data for charts
const patientFlowData = [
  { time: "00:00", patients: 4 },
  { time: "04:00", patients: 3 },
  { time: "08:00", patients: 7 },
  { time: "12:00", patients: 8 },
  { time: "16:00", patients: 6 },
  { time: "20:00", patients: 5 },
];

const departmentData = [
  { name: "ICU", value: 85 },
  { name: "ER", value: 65 },
  { name: "Surgery", value: 45 },
  { name: "Pediatrics", value: 30 },
];

const appointmentData = [
  { department: "Cardiology", count: 12 },
  { department: "Neurology", count: 8 },
  { department: "Orthopedics", count: 15 },
  { department: "Pediatrics", count: 10 },
];

const COLORS = ["#DB5F8E", "#9c3d68", "#db8baa", "#e6b3c7"];

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

const numberVariants = {
  hidden: { opacity: 0, scale: 0.5 },
  show: {
    opacity: 1,
    scale: 1,
    transition: {
      type: "spring",
      stiffness: 200,
      damping: 10,
    },
  },
};

export function DashboardGrid() {
  return (
    <motion.div
      className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6"
      variants={containerVariants}
      initial="hidden"
      animate="show"
    >
      {/* Patient Flow Chart */}
      <motion.div variants={cardVariants}>
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Users className="h-5 w-5" />
              Daily Patient Flow
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-[300px]">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={patientFlowData}>
                  <defs>
                    <linearGradient
                      id="colorPatients"
                      x1="0"
                      y1="0"
                      x2="0"
                      y2="1"
                    >
                      <stop offset="5%" stopColor="#DB5F8E" stopOpacity={0.8} />
                      <stop offset="95%" stopColor="#DB5F8E" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="time" />
                  <YAxis />
                  <Tooltip />
                  <Area
                    type="monotone"
                    dataKey="patients"
                    stroke="#DB5F8E"
                    fillOpacity={1}
                    fill="url(#colorPatients)"
                  />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>
      </motion.div>

      {/* Department Occupancy */}
      <motion.div variants={cardVariants}>
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Building2 className="h-5 w-5" />
              Department Occupancy
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-[300px]">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={departmentData}
                    cx="50%"
                    cy="50%"
                    innerRadius={60}
                    outerRadius={80}
                    paddingAngle={5}
                    dataKey="value"
                  >
                    {departmentData.map((entry, index) => (
                      <Cell
                        key={`cell-${index}`}
                        fill={COLORS[index % COLORS.length]}
                      />
                    ))}
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>
      </motion.div>

      {/* Pending Appointments */}
      <motion.div variants={cardVariants}>
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Clock className="h-5 w-5" />
              Pending Appointments
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-[300px]">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={appointmentData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis
                    dataKey="department"
                    angle={-45}
                    textAnchor="end"
                    height={60}
                  />
                  <YAxis />
                  <Tooltip />
                  <Bar dataKey="count" fill="#DB5F8E" />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>
      </motion.div>

      {/* Staff Stats Card */}
      <motion.div variants={cardVariants}>
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <UserCog className="h-5 w-5" />
              Staff on Duty
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex justify-between items-center">
                <span>Doctors</span>
                <motion.span
                  className="font-semibold"
                  variants={numberVariants}
                >
                  24
                </motion.span>
              </div>
              <div className="flex justify-between items-center">
                <span>Nurses</span>
                <motion.span
                  className="font-semibold"
                  variants={numberVariants}
                >
                  45
                </motion.span>
              </div>
              <div className="flex justify-between items-center">
                <span>Support Staff</span>
                <motion.span
                  className="font-semibold"
                  variants={numberVariants}
                >
                  12
                </motion.span>
              </div>
            </div>
          </CardContent>
        </Card>
      </motion.div>

      {/* Critical Cases */}
      <motion.div variants={cardVariants}>
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <AlertCircle className="h-5 w-5" />
              Critical Cases
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex justify-between items-center">
                <span>ICU</span>
                <motion.span
                  className="font-semibold text-red-500"
                  variants={numberVariants}
                >
                  8
                </motion.span>
              </div>
              <div className="flex justify-between items-center">
                <span>Emergency</span>
                <motion.span
                  className="font-semibold text-orange-500"
                  variants={numberVariants}
                >
                  12
                </motion.span>
              </div>
              <div className="flex justify-between items-center">
                <span>Total Critical</span>
                <motion.span
                  className="font-semibold"
                  variants={numberVariants}
                >
                  20
                </motion.span>
              </div>
            </div>
          </CardContent>
        </Card>
      </motion.div>

      {/* Average Wait Times */}
      <motion.div variants={cardVariants}>
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Clock className="h-5 w-5" />
              Average Wait Times
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex justify-between items-center">
                <span>Emergency</span>
                <motion.span
                  className="font-semibold"
                  variants={numberVariants}
                >
                  10 mins
                </motion.span>
              </div>
              <div className="flex justify-between items-center">
                <span>Non-Emergency</span>
                <motion.span
                  className="font-semibold"
                  variants={numberVariants}
                >
                  45 mins
                </motion.span>
              </div>
              <div className="flex justify-between items-center">
                <span>Specialist</span>
                <motion.span
                  className="font-semibold"
                  variants={numberVariants}
                >
                  30 mins
                </motion.span>
              </div>
            </div>
          </CardContent>
        </Card>
      </motion.div>
    </motion.div>
  );
}

"use client";
import React, { useEffect, useState, useCallback } from "react";
import { toast } from "sonner";
import { PatternFormat } from "react-number-format";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Checkbox } from "@/components/ui/checkbox";
import { Textarea } from "@/components/ui/textarea";
import dayjs from "dayjs";
import "dayjs/locale/th";
import buddhistEra from "dayjs/plugin/buddhistEra";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { DatePicker, message, Upload } from "antd";
import th_TH from "antd/es/date-picker/locale/th_TH";
import { LoadingOutlined, PlusOutlined } from "@ant-design/icons";
import type { GetProp, UploadProps } from "antd";
import { uploadImage } from "@/app/(main)/patient-create/_actions/uploadImage";
import { useRouter } from "next/navigation";
import { ImageCropModal } from "@/components/ImageCropModal";

dayjs.extend(buddhistEra);
dayjs.locale("th");

const buddhistLocale: typeof th_TH = {
  ...th_TH,
  lang: {
    ...th_TH.lang,
    yearFormat: "BBBB",
    cellYearFormat: "BBBB",
  },
};

// Define a type for your form data for better type safety
interface FormData {
  patientId: string;
  title: string;
  first_name: string;
  last_name: string;
  phone_num: string;
  email: string | null;
  weight: number | null;
  height: number | null;
  address: string;
  road: string;
  sub_district: string;
  district: string;
  province: string;
  postal_num: string;
  date_of_birth: string;
  imageUrl: string | null;
  // New fields
  caregiver_name: string;
  media_consent: boolean | null;
  transportation: string;
  transportation_other: string;
  parking_requirement: boolean | null;
  distance_from_home: number | null;
  gender: string;
  marital_status: string;
  education_level: string;
  fall_history: boolean | null;
  underlying_diseases: string[];
  underlying_diseases_other: string;
  hospitalization_history: boolean | null;
  age: number | null;
}

// Helper function for base64 conversion (can be moved to a utils file)
const getBase64 = (img: File, callback: (url: string) => void) => {
  const reader = new FileReader();
  reader.addEventListener("load", () => callback(reader.result as string));
  reader.readAsDataURL(img);
};

// Component for handling image uploads
interface ImageUploadProps {
  onImageSelected: (base64: string) => void;
  imageUrl: string | null;
}

const ImageUpload: React.FC<ImageUploadProps> = ({ onImageSelected, imageUrl }) => {
  const [loading, setLoading] = useState(false);

  const beforeUpload = (file: File) => {
    const isJpgOrPng = file.type === "image/jpeg" || file.type === "image/png";
    if (!isJpgOrPng) {
      message.error("You can only upload JPG/PNG file!");
      toast.error("คุณสามารถอัปโหลดไฟล์ JPG/PNG เท่านั้น");
    }
    const isLt5M = file.size / 1024 / 1024 < 5;
    if (!isLt5M) {
      message.error("Image must be smaller than 5MB!");
      toast.error("ไฟล์รูปภาพต้องมีขนาดไม่เกิน 5 MB");
    }
    return isJpgOrPng && isLt5M;
  };

  const handleChange: UploadProps["onChange"] = (info) => {
    if (info.file.status === "uploading") {
      setLoading(true);
      return;
    }
    if (info.file.status === "done") {
      getBase64(info.file.originFileObj as File, (url) => {
        setLoading(false);
        onImageSelected(url); // Pass base64 string to parent
      });
    }
  };

  const uploadButton = (
    <button style={{ border: 0, background: "none" }} type="button">
      {loading ? <LoadingOutlined /> : <PlusOutlined />}
      <div style={{ marginTop: 8 }}>
        อัปโหลดรูปภาพ ระบบรองรับไฟล์นามสกุล .jpg .jpeg .png ขนาดไม่เกิน 5 mb
      </div>
    </button>
  );

  return (
    <Upload
      name="avatar"
      listType="picture-card"
      className="avatar-uploader w-full h-auto"
      showUploadList={false}
      beforeUpload={beforeUpload}
      customRequest={({ file, onSuccess }) => {
        setTimeout(() => {
          if (onSuccess)
            onSuccess("ok");
        }, 0);
      }}
      onChange={handleChange}
      style={{ width: "100%", height: "auto" }}
    >
      {imageUrl ? (
        <div>
          <img src={imageUrl} alt="avatar" style={{ width: "100%", height: "auto" }} />
          <p className="text-sm py-2">กดที่นี่เพื่อเปลี่ยนรูปภาพ/อัปโหลดใหม่</p>
        </div>
      ) : (
        uploadButton
      )}
    </Upload>
  );
};

interface PatientEditFormProps {
  initialData: any;
}

// Main PatientEditForm Component
function PatientEditForm({ initialData }: PatientEditFormProps) {
  const router = useRouter();
  const [date, setDate] = React.useState<dayjs.Dayjs | null>(null);
  const [cropImgSrc, setCropImgSrc] = useState("");
  const [isCropModalOpen, setIsCropModalOpen] = useState(false);
  const [previewImageUrl, setPreviewImageUrl] = useState<string | null>(null);
  
  // Initialize form data from initialData
  const [formData, setFormData] = useState<FormData>(() => {
    // Process transportation
    let transportation = initialData.transportation || "";
    let transportation_other = "";
    const standardTransportations = ["self_drive", "relative", "bts"];
    if (transportation && !standardTransportations.includes(transportation)) {
        transportation_other = transportation;
        transportation = "other";
    }

    // Process underlying diseases
    let underlying_diseases = initialData.underlying_diseases || [];
    let underlying_diseases_other = "";
    const standardDiseases = [
        "none", "hypertension", "diabetes", "cancer_non_skin", "chronic_lung",
        "acute_coronary", "heart_failure", "asthma", "angina", "arthritis",
        "stroke", "kidney_disease"
    ];
    
    // Check if there are any non-standard diseases
    const otherDiseases = underlying_diseases.filter((d: string) => !standardDiseases.includes(d));
    if (otherDiseases.length > 0) {
        underlying_diseases_other = otherDiseases[0]; // Assuming only one 'other' disease for simplicity or join them
        underlying_diseases = underlying_diseases.filter((d: string) => standardDiseases.includes(d));
        underlying_diseases.push("other");
    }

    return {
        patientId: initialData.id || "",
        title: initialData.title || "",
        first_name: initialData.first_name || "",
        last_name: initialData.last_name || "",
        phone_num: initialData.phone_num || "",
        email: initialData.email || null,
        weight: initialData.weight || null,
        height: initialData.height || null,
        address: initialData.address || "",
        road: initialData.road || "",
        sub_district: initialData.sub_district || "",
        district: initialData.district || "",
        province: initialData.province || "",
        postal_num: initialData.postal_num || "",
        date_of_birth: initialData.date_of_birth || "",
        imageUrl: initialData.profile_image_url || null,
        caregiver_name: initialData.caregiver_name || "",
        media_consent: initialData.media_consent,
        transportation: transportation,
        transportation_other: transportation_other,
        parking_requirement: initialData.parking_requirement,
        distance_from_home: initialData.distance_from_home || null,
        gender: initialData.gender || "",
        marital_status: initialData.marital_status || "",
        education_level: initialData.education_level || "",
        fall_history: initialData.fall_history,
        underlying_diseases: underlying_diseases,
        underlying_diseases_other: underlying_diseases_other,
        hospitalization_history: initialData.hospitalization_history,
        age: null,
    };
  });

  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (formData.date_of_birth) {
        setDate(dayjs(formData.date_of_birth));
    }
    if (formData.imageUrl) {
        setPreviewImageUrl(formData.imageUrl);
    }
  }, []);

  // Calculate age when DOB changes
  useEffect(() => {
    if (formData.date_of_birth) {
      const birthDate = dayjs(formData.date_of_birth);
      const age = dayjs().diff(birthDate, 'year');
      setFormData(prev => ({ ...prev, age }));
    }
  }, [formData.date_of_birth]);

  // Unified change handler for all input fields
  const handleChange = useCallback(
    (event: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
      const { name, value } = event.target;
      setFormData((prevData) => ({
        ...prevData,
        [name]: value,
      }));
    },
    []
  );

  const handleRadioChange = (name: string, value: any) => {
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleCheckboxChange = (value: string, checked: boolean | string) => {
    setFormData((prev) => {
      const current = prev.underlying_diseases;
      if (checked === true) {
        return { ...prev, underlying_diseases: [...current, value] };
      } else {
        return { ...prev, underlying_diseases: current.filter((item) => item !== value) };
      }
    });
  };


  // Handle select change
  const handleSelectChange = useCallback((value: string, name: string) => {
    setFormData((prevData) => ({
      ...prevData,
      [name]: value,
    }));
  }, []);

  const handleImageSelected = (base64: string) => {
    setCropImgSrc(base64);
    setIsCropModalOpen(true);
  };

  // Handle image upload success
  const handleImageUploadSuccess = useCallback(async (croppedBase64: string) => {
    setPreviewImageUrl(croppedBase64);
    if (formData.patientId) {
      try {
        const imageUrl = await uploadImage(croppedBase64.split(",")[1], formData.patientId);
        setFormData((prevData) => ({
          ...prevData,
          imageUrl: imageUrl,
        }));
        toast.success("อัปโหลดรูปภาพสำเร็จ");
      } catch (error) {
        console.error("Error uploading image:", error);
        toast.error("เกิดข้อผิดพลาดในการอัปโหลดรูปภาพ");
      }
    } else {
      toast.error("ไม่สามารถอัปโหลดรูปภาพได้: ไม่มีรหัสผู้ใช้บริการ");
    }
  }, [formData.patientId]);

  const handleSubmit = useCallback(
    async (event: React.FormEvent<HTMLFormElement>) => {
      event.preventDefault();
      setIsSubmitting(true);

      // Data validation for required fields
      const requiredFields: Array<keyof FormData> = [
        "patientId",
        "title",
        "first_name",
        "last_name",
        "date_of_birth",
        "phone_num",
        "gender",
        "marital_status",
        "education_level",
        "transportation",
        "parking_requirement",
        "media_consent",
        "fall_history",
        "hospitalization_history",
        "height",
        "weight",
        "address", // Assuming address fields are required as per original form
      ];
      
      const fieldNamesMap: Record<string, string> = {
        patientId: "เลขบัตรประชาชน",
        title: "คำนำหน้า",
        first_name: "ชื่อ",
        last_name: "นามสกุล",
        phone_num: "เบอร์โทรศัพท์",
        email: "อีเมล",
        weight: "น้ำหนัก",
        height: "ส่วนสูง",
        address: "ที่อยู่",
        road: "ถนน",
        sub_district: "ตำบล/แขวง",
        district: "อำเภอ/เขต",
        province: "จังหวัด",
        postal_num: "รหัสไปรษณีย์",
        date_of_birth: "วันเกิด",
        imageUrl: "รูปภาพ",
        gender: "เพศ",
        marital_status: "สถานภาพสมรส",
        education_level: "ระดับการศึกษา",
        transportation: "การเดินทาง",
        parking_requirement: "ความต้องการที่จอดรถ",
        media_consent: "ความยินยอมเผยแพร่ภาพ",
        fall_history: "ประวัติการหกล้ม",
        hospitalization_history: "ประวัติการเข้ารักษาตัวในโรงพยาบาล",
      };

      const missingFields = requiredFields.filter(
        (field) => {
            const value = formData[field];
            if (value === null || value === undefined) return true;
            if (typeof value === 'string' && value.trim() === "") return true;
            return false;
        }
      );

      // Patient ID must be exactly 13 digits
      const cleanedPatientId = formData.patientId.replace(/[-_]/g, "");
      if (cleanedPatientId.length !== 13) {
        toast.error("เลขบัตรประชาชนต้องมีความยาว 13 หลัก");
        setIsSubmitting(false);
        return;
      }

      // Phone number must be exactly 10 digits
      const cleanedPhone = formData.phone_num.replace(/[-_]/g, "");
      if (cleanedPhone.length !== 10) {
        toast.error("เบอร์โทรศัพท์ต้องมีความยาว 10 หลัก");
        setIsSubmitting(false);
        return;
      }

      if (missingFields.length > 0) {
        toast.error(
          `กรุณากรอกข้อมูลให้ครบถ้วน: ${missingFields
            .map((field) => fieldNamesMap[field as string] || field)
            .join(", ")}`
        );
        setIsSubmitting(false);
        return;
      }

      try {
        // Prepare payload
        let finalTransportation = formData.transportation;
        if (formData.transportation === 'other' && formData.transportation_other) {
            finalTransportation = formData.transportation_other;
        }

        let finalDiseases = [...formData.underlying_diseases];
        if (finalDiseases.includes('other')) {
            finalDiseases = finalDiseases.filter(d => d !== 'other');
            if (formData.underlying_diseases_other) {
                finalDiseases.push(formData.underlying_diseases_other);
            }
        }

        const payload = {
          id: cleanedPatientId,
          title: formData.title,
          first_name: formData.first_name,
          last_name: formData.last_name,
          date_of_birth: formData.date_of_birth,
          phone_num: cleanedPhone,
          email: formData.email || null,
          weight: formData.weight || null,
          height: formData.height || null,
          address: formData.address,
          road: formData.road,
          sub_district: formData.sub_district,
          district: formData.district,
          province: formData.province,
          postal_num: formData.postal_num,
          profile_image_url: formData.imageUrl,
          // New fields
          caregiver_name: formData.caregiver_name || null,
          media_consent: formData.media_consent,
          transportation: finalTransportation,
          parking_requirement: formData.parking_requirement,
          distance_from_home: formData.distance_from_home || null,
          gender: formData.gender,
          marital_status: formData.marital_status,
          education_level: formData.education_level,
          fall_history: formData.fall_history,
          underlying_diseases: finalDiseases,
          hospitalization_history: formData.hospitalization_history,
        };

        const response = await fetch("/api/v1/patients/updatePatient", {
          method: "PATCH",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify(payload),
        });

        if (response.ok) {
          const data = await response.json();
          console.log("Patient updated successfully:", data);
          toast.success("บันทึกการแก้ไขสำเร็จ");
          router.push(`/patient/${formData.patientId}/home`);
        } else {
          const errorData = await response.json();
          throw new Error(errorData.message || "Failed to update patient");
        }
      } catch (error) {
        console.error("Error updating patient:", error);
        if (error instanceof Error) {
          toast.error("เกิดข้อผิดพลาดในการบันทึกข้อมูล: " + error.message);
        } else {
          toast.error("เกิดข้อผิดพลาดในการบันทึกข้อมูล");
        }
      } finally {
        setIsSubmitting(false);
      }
    },
    [formData, router]
  );

  return (
    <>
      <form className="flex flex-col items-end space-y-8" onSubmit={handleSubmit}>
        {/* Required field note */}
        <div className="w-full mb-2 text-sm text-red-500">* จำเป็นต้องกรอกข้อมูล</div>
        
        {/* Section 1: Personal Information */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 w-full">
          <h2 className="text font-bold md:col-span-2 flex items-center gap-2">
            <span className="flex items-center justify-center w-8 h-8 border-2 border-pink-400 rounded-full shrink-0">
              1
            </span>
            ข้อมูลส่วนตัว (Personal Information)
          </h2>
          
          <div className="grid md:col-span-2">
            <Label className="py-2 text-base">เลขบัตรประชาชน 13 หลัก (Thai ID) <span className="text-red-500">*</span></Label>
            <PatternFormat
              id="patientId"
              name="patientId"
              format="#-####-#####-##-#"
              mask="_"
              value={formData.patientId}
              onChange={handleChange}
              disabled={true} // Disable ID editing
              className="flex h-10 w-full rounded-md border border-input bg-gray-100 px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
            />
          </div>

          <div className="grid col-span-1">
            <Label className="py-2 text-base">คำนำหน้าชื่อ <span className="text-red-500">*</span></Label>
            <Select
              onValueChange={(value) => handleSelectChange(value, "title")}
              name="title"
              value={formData.title}
            >
              <SelectTrigger className="w-full">
                <SelectValue placeholder="คำนำหน้า" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="นาย">นาย</SelectItem>
                <SelectItem value="นาง">นาง</SelectItem>
                <SelectItem value="นางสาว">นางสาว</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="grid col-span-1">
            <Label className="py-2 text-base">ชื่อ (First Name) <span className="text-red-500">*</span></Label>
            <Input
              type="text"
              placeholder="ชื่อ"
              name="first_name"
              value={formData.first_name}
              onChange={handleChange}
            />
          </div>

          <div className="grid col-span-1">
            <Label className="py-2 text-base">นามสกุล (Last Name) <span className="text-red-500">*</span></Label>
            <Input
              type="text"
              placeholder="นามสกุล"
              name="last_name"
              value={formData.last_name}
              onChange={handleChange}
            />
          </div>

          <div className="grid col-span-1">
            <Label className="py-2 text-base">วัน/เดือน/ปีเกิด (Date of Birth) <span className="text-red-500">*</span></Label>
            <DatePicker
              locale={buddhistLocale}
              className="w-full h-10"
              name="date_of_birth"
              value={date}
              onChange={(dateObj) => {
                setDate(dateObj);
                setFormData((prevData) => ({
                  ...prevData,
                  date_of_birth: dateObj ? dateObj.format("YYYY-MM-DD") : "",
                }));
              }}
              format={"DD MMMM BBBB"}
            />
          </div>

          <div className="grid col-span-1">
            <Label className="py-2 text-base">อายุ (Age)</Label>
            <Input
              type="number"
              placeholder="อายุ"
              value={formData.age || ""}
              readOnly
              className="bg-gray-100"
            />
          </div>

          <div className="grid col-span-1">
            <Label className="py-2 text-base">เพศ (Gender) <span className="text-red-500">*</span></Label>
            <RadioGroup
              onValueChange={(value) => handleRadioChange("gender", value)}
              value={formData.gender}
              className="flex flex-row space-x-4 mt-2"
            >
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="female" id="gender-female" />
                <Label htmlFor="gender-female">หญิง</Label>
              </div>
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="male" id="gender-male" />
                <Label htmlFor="gender-male">ชาย</Label>
              </div>
            </RadioGroup>
          </div>

          <div className="grid md:col-span-2">
            <Label className="py-2 text-base">สถานภาพสมรส (Marital Status) <span className="text-red-500">*</span></Label>
            <RadioGroup
              onValueChange={(value) => handleRadioChange("marital_status", value)}
              value={formData.marital_status}
              className="flex flex-wrap gap-4 mt-2"
            >
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="single" id="status-single" />
                <Label htmlFor="status-single">โสด</Label>
              </div>
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="married" id="status-married" />
                <Label htmlFor="status-married">สมรส</Label>
              </div>
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="divorced" id="status-divorced" />
                <Label htmlFor="status-divorced">หย่า</Label>
              </div>
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="widowed" id="status-widowed" />
                <Label htmlFor="status-widowed">คู่สมรสเสียชีวิต</Label>
              </div>
            </RadioGroup>
          </div>

          <div className="grid md:col-span-2">
            <Label className="py-2 text-base">ระดับการศึกษา (Education Level) <span className="text-red-500">*</span></Label>
            <RadioGroup
              onValueChange={(value) => handleRadioChange("education_level", value)}
              value={formData.education_level}
              className="flex flex-col space-y-2 mt-2"
            >
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="none" id="edu-none" />
                <Label htmlFor="edu-none">ไม่ได้เรียน</Label>
              </div>
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="primary" id="edu-primary" />
                <Label htmlFor="edu-primary">ประถมศึกษา</Label>
              </div>
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="lower_secondary" id="edu-lower" />
                <Label htmlFor="edu-lower">มัธยมศึกษาตอนต้น</Label>
              </div>
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="upper_secondary" id="edu-upper" />
                <Label htmlFor="edu-upper">มัธยมศึกษาตอนปลาย</Label>
              </div>
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="bachelor_plus" id="edu-bachelor" />
                <Label htmlFor="edu-bachelor">ปริญญาตรีขึ้นไป</Label>
              </div>
            </RadioGroup>
          </div>
        </div>

        {/* Section 2: Contact & Address */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 w-full pt-4 border-t">
          <h2 className="text font-bold md:col-span-2 flex items-center gap-2">
            <span className="flex items-center justify-center w-8 h-8 border-2 border-pink-400 rounded-full shrink-0">
              2
            </span>
            ข้อมูลการติดต่อและที่อยู่ (Contact & Address)
          </h2>

          <div className="grid">
            <Label className="py-2 text-base">เบอร์โทรศัพท์ (Phone Number) <span className="text-red-500">*</span></Label>
            <PatternFormat
              id="phone_num"
              name="phone_num"
              format="###-###-####"
              mask="_"
              value={formData.phone_num}
              onChange={handleChange}
              className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
            />
          </div>

          <div className="grid">
            <Label className="py-2 text-base">อีเมล (Email)</Label>
            <Input
              type="email"
              placeholder="อีเมล"
              name="email"
              value={formData.email || ""}
              onChange={handleChange}
            />
          </div>

          <div className="grid md:col-span-2">
            <Label className="py-2 text-base">ชื่อ-สกุล ผู้ดูแล/ญาติ (Caregiver Name)</Label>
            <Input
              type="text"
              placeholder="ชื่อ-สกุล ผู้ดูแล"
              name="caregiver_name"
              value={formData.caregiver_name}
              onChange={handleChange}
            />
          </div>

          <div className="grid md:col-span-2">
            <Label className="py-2 text-base">ที่อยู่ปัจจุบัน (Current Address) <span className="text-red-500">*</span></Label>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 p-4 border rounded-md bg-gray-50">
                <div className="grid md:col-span-2">
                    <Label className="text-sm">บ้านเลขที่, หมู่, ซอย</Label>
                    <Input
                    type="text"
                    name="address"
                    value={formData.address}
                    onChange={handleChange}
                    />
                </div>
                <div className="grid">
                    <Label className="text-sm">ถนน</Label>
                    <Input
                    type="text"
                    name="road"
                    value={formData.road}
                    onChange={handleChange}
                    />
                </div>
                <div className="grid">
                    <Label className="text-sm">ตำบล/แขวง</Label>
                    <Input
                    type="text"
                    name="sub_district"
                    value={formData.sub_district}
                    onChange={handleChange}
                    />
                </div>
                <div className="grid">
                    <Label className="text-sm">อำเภอ/เขต</Label>
                    <Input
                    type="text"
                    name="district"
                    value={formData.district}
                    onChange={handleChange}
                    />
                </div>
                <div className="grid">
                    <Label className="text-sm">จังหวัด</Label>
                    <Input
                    type="text"
                    name="province"
                    value={formData.province}
                    onChange={handleChange}
                    />
                </div>
                <div className="grid">
                    <Label className="text-sm">รหัสไปรษณีย์</Label>
                    <Input
                    type="text"
                    name="postal_num"
                    value={formData.postal_num}
                    onChange={handleChange}
                    />
                </div>
            </div>
          </div>
        </div>

        {/* Section 3: Health Information */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 w-full pt-4 border-t">
          <h2 className="text font-bold md:col-span-2 flex items-center gap-2">
            <span className="flex items-center justify-center w-8 h-8 border-2 border-pink-400 rounded-full shrink-0">
              3
            </span>
            ข้อมูลสุขภาพ (Health Information)
          </h2>

          <div className="grid">
            <Label className="py-2 text-base">น้ำหนัก (Weight) (kg) <span className="text-red-500">*</span></Label>
            <Input
              type="number"
              name="weight"
              value={formData.weight || ""}
              onChange={handleChange}
            />
          </div>

          <div className="grid">
            <Label className="py-2 text-base">ส่วนสูง (Height) (cm) <span className="text-red-500">*</span></Label>
            <Input
              type="number"
              name="height"
              value={formData.height || ""}
              onChange={handleChange}
            />
          </div>

          <div className="grid md:col-span-2">
            <Label className="py-2 text-base">โรคประจำตัว (Underlying Diseases) <span className="text-red-500">*</span></Label>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-2 mt-2">
                {[
                    { id: "none", label: "ไม่มี" },
                    { id: "hypertension", label: "ความดันโลหิตสูง" },
                    { id: "diabetes", label: "เบาหวาน" },
                    { id: "cancer_non_skin", label: "มะเร็ง (ไม่รวมมะเร็งผิวหนัง)" },
                    { id: "chronic_lung", label: "โรคปอดเรื้อรัง" },
                    { id: "acute_coronary", label: "โรคหลอดเลือดหัวใจกำเริบ" },
                    { id: "heart_failure", label: "ภาวะหัวใจวาย" },
                    { id: "asthma", label: "โรคหอบหืด" },
                    { id: "angina", label: "อาการแน่นหน้าหลังจากโรคหลอดเลือดหัวใจ" },
                    { id: "arthritis", label: "ภาวะข้ออักเสบ" },
                    { id: "stroke", label: "โรคหลอดเลือดสมอง" },
                    { id: "kidney_disease", label: "โรคไต" },
                ].map((disease) => (
                    <div key={disease.id} className="flex items-center space-x-2">
                        <Checkbox
                            id={`disease-${disease.id}`}
                            checked={formData.underlying_diseases.includes(disease.id)}
                            onCheckedChange={(checked) => handleCheckboxChange(disease.id, checked)}
                        />
                        <Label htmlFor={`disease-${disease.id}`}>{disease.label}</Label>
                    </div>
                ))}
                <div className="flex items-center space-x-2 col-span-1 md:col-span-2">
                    <Checkbox
                        id="disease-other"
                        checked={formData.underlying_diseases.includes('other')}
                        onCheckedChange={(checked) => handleCheckboxChange('other', checked)}
                    />
                    <Label htmlFor="disease-other">อื่นๆ</Label>
                    {formData.underlying_diseases.includes('other') && (
                        <Input
                            type="text"
                            placeholder="ระบุโรคประจำตัวอื่นๆ"
                            name="underlying_diseases_other"
                            value={formData.underlying_diseases_other}
                            onChange={handleChange}
                            className="ml-2 flex-1"
                        />
                    )}
                </div>
            </div>
          </div>

          <div className="grid md:col-span-2">
            <Label className="py-2 text-base">ประวัติการหกล้ม (Fall History) <span className="text-red-500">*</span></Label>
            <RadioGroup
              onValueChange={(value) => handleRadioChange("fall_history", value === 'true')}
              value={formData.fall_history === null ? "" : formData.fall_history.toString()}
              className="flex flex-row space-x-4 mt-2"
            >
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="true" id="fall-yes" />
                <Label htmlFor="fall-yes">เคย</Label>
              </div>
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="false" id="fall-no" />
                <Label htmlFor="fall-no">ไม่เคย</Label>
              </div>
            </RadioGroup>
          </div>

          <div className="grid md:col-span-2">
            <Label className="py-2 text-base">การเข้ารับการรักษาตัวในโรงพยาบาล ในระยะเวลา 1 ปี ที่ผ่านมา <span className="text-red-500">*</span></Label>
            <RadioGroup
              onValueChange={(value) => handleRadioChange("hospitalization_history", value === 'true')}
              value={formData.hospitalization_history === null ? "" : formData.hospitalization_history.toString()}
              className="flex flex-row space-x-4 mt-2"
            >
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="true" id="hosp-yes" />
                <Label htmlFor="hosp-yes">เคย</Label>
              </div>
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="false" id="hosp-no" />
                <Label htmlFor="hosp-no">ไม่เคย</Label>
              </div>
            </RadioGroup>
          </div>
        </div>

        {/* Section 4: Service Preferences */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 w-full pt-4 border-t">
          <h2 className="text font-bold md:col-span-2 flex items-center gap-2">
            <span className="flex items-center justify-center w-8 h-8 border-2 border-pink-400 rounded-full shrink-0">
              4
            </span>
            ข้อมูลการเดินทางและบริการ (Transportation & Service)
          </h2>

          <div className="grid md:col-span-2">
            <Label className="py-2 text-base">การเดินทาง (Transportation) <span className="text-red-500">*</span></Label>
            <RadioGroup
              onValueChange={(value) => handleRadioChange("transportation", value)}
              value={formData.transportation}
              className="flex flex-col space-y-2 mt-2"
            >
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="self_drive" id="trans-self" />
                <Label htmlFor="trans-self">ขับรถมาเอง</Label>
              </div>
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="relative" id="trans-relative" />
                <Label htmlFor="trans-relative">ญาติมาส่ง</Label>
              </div>
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="bts" id="trans-bts" />
                <Label htmlFor="trans-bts">BTS</Label>
              </div>
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="other" id="trans-other" />
                <Label htmlFor="trans-other">อื่นๆ</Label>
                {formData.transportation === 'other' && (
                    <Input
                        type="text"
                        placeholder="ระบุการเดินทาง"
                        name="transportation_other"
                        value={formData.transportation_other}
                        onChange={handleChange}
                        className="ml-2 flex-1"
                    />
                )}
              </div>
            </RadioGroup>
          </div>

          <div className="grid md:col-span-2">
            <Label className="py-2 text-base">ความต้องการที่จอดรถ (Parking Requirement) <span className="text-red-500">*</span></Label>
            <RadioGroup
              onValueChange={(value) => handleRadioChange("parking_requirement", value === 'true')}
              value={formData.parking_requirement === null ? "" : formData.parking_requirement.toString()}
              className="flex flex-row space-x-4 mt-2"
            >
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="true" id="parking-yes" />
                <Label htmlFor="parking-yes">ต้องการ</Label>
              </div>
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="false" id="parking-no" />
                <Label htmlFor="parking-no">ไม่ต้องการ</Label>
              </div>
            </RadioGroup>
          </div>

          <div className="grid">
            <Label className="py-2 text-base">ระยะทางจากบ้านถึงศูนย์ (กม.)</Label>
            <Input
              type="number"
              step="0.1"
              name="distance_from_home"
              value={formData.distance_from_home || ""}
              onChange={handleChange}
            />
            <p className="text-xs text-muted-foreground mt-1">เจ้าหน้าที่ตรวจสอบเองจาก Google Map</p>
          </div>

          <div className="grid md:col-span-2">
            <Label className="py-2 text-base">ท่านยินดีให้เผยแพร่ภาพ หรือเสียงของท่านระหว่างทำกิจกรรมที่ศูนย์ส่งเสริมสุขภาวะผู้สูงอายุ หรือไม่ <span className="text-red-500">*</span></Label>
            <RadioGroup
              onValueChange={(value) => handleRadioChange("media_consent", value === 'true')}
              value={formData.media_consent === null ? "" : formData.media_consent.toString()}
              className="flex flex-row space-x-4 mt-2"
            >
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="true" id="consent-yes" />
                <Label htmlFor="consent-yes">ยินดี</Label>
              </div>
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="false" id="consent-no" />
                <Label htmlFor="consent-no">ไม่ยินดี</Label>
              </div>
            </RadioGroup>
          </div>
        </div>

        {/* Section 5: Image */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 w-full pt-4 border-t">
          <h2 className="text font-bold md:col-span-2 flex items-center gap-2">
            <span className="flex items-center justify-center w-8 h-8 border-2 border-pink-400 rounded-full shrink-0">
              5
            </span>
            รูปภาพ (Image)
          </h2>
          <div className="grid md:col-span-2">
            <Label className="py-2 text-base">
              รูปภาพผู้ใช้บริการ (Patient Image)
            </Label>
            <ImageUpload onImageSelected={handleImageSelected} imageUrl={previewImageUrl} />
          </div>
        </div>

        <Button type="submit" className="mt-4 w-full md:w-auto" disabled={isSubmitting}>
          {isSubmitting ? "กำลังบันทึก..." : "บันทึกการแก้ไข"}
        </Button>
      </form>
      <ImageCropModal
        open={isCropModalOpen}
        onOpenChange={setIsCropModalOpen}
        imgSrc={cropImgSrc}
        onCropComplete={handleImageUploadSuccess}
      />
    </>
  );
}

export default PatientEditForm;

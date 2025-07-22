"use client";
import React, { useEffect, useState, useCallback } from "react";
import { toast } from "sonner";
import { PatternFormat } from "react-number-format";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
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

// Main PatientCreateForm Component
function PatientCreateForm({ patientId }: { patientId?: string }) {
  const router = useRouter();
  const [date, setDate] = React.useState<dayjs.Dayjs | null>(null);
  const [cropImgSrc, setCropImgSrc] = useState("");
  const [isCropModalOpen, setIsCropModalOpen] = useState(false);
  const [previewImageUrl, setPreviewImageUrl] = useState<string | null>(null);
  const [formData, setFormData] = useState<FormData>({
    patientId: patientId?.replace(/-/g, "") || "", // Clean ID upfront
    title: "",
    first_name: "",
    last_name: "",
    phone_num: "",
    email: null,
    weight: null,
    height: null,
    address: "",
    road: "",
    sub_district: "",
    district: "",
    province: "",
    postal_num: "",
    date_of_birth: "",
    imageUrl: null,
  });

  const [isSubmitting, setIsSubmitting] = useState(false);

  // Update formData when patientId prop changes (e.g., if navigated from another page with an ID)
  useEffect(() => {
    setFormData((prevData) => ({
      ...prevData,
      patientId: patientId?.replace(/-/g, "") || "",
    }));
  }, [patientId]);

  // Unified change handler for all input fields
  const handleChange = useCallback(
    (event: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
      const { name, value } = event.target;
      setFormData((prevData) => ({
        ...prevData,
        [name]: value,
      }));
    },
    []
  );


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
      toast.error("ไม่สามารถอัปโหลดรูปภาพได้: ไม่มีรหัสผู้ป่วย");
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
      ];
      const fieldNamesMap: Record<keyof FormData, string> = {
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
      };

      const missingFields = requiredFields.filter(
        (field) => !formData[field] || String(formData[field]).trim() === ""
      );

      // Patient ID must be exactly 13 digits
      const cleanedPatientId = formData.patientId.replace(/[-_]/g, "");
      console.log("Cleaned Patient ID:", cleanedPatientId);
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
            .map((field) => fieldNamesMap[field])
            .join(", ")}`
        );
        setIsSubmitting(false);
        return;
      }

      try {
        const payload = {
          id: cleanedPatientId, // Already cleaned
          title: formData.title,
          first_name: formData.first_name,
          last_name: formData.last_name,
          date_of_birth: formData.date_of_birth,
          phone_num: cleanedPhone, // Use already cleaned phone number
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
        };

        const response = await fetch("/api/v1/patients/createPatient", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify(payload),
        });

        if (response.ok) {
          const data = await response.json();
          console.log("Patient created successfully:", data);
          toast.success("บันทึกข้อมูลสำเร็จ");
          router.push(`/patient/${formData.patientId}/home`);
        } else {
          const errorData = await response.json();
          throw new Error(errorData.message || "Failed to create patient");
        }
      } catch (error) {
        console.error("Error creating patient:", error);
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
      <form className="flex flex-col items-end " onSubmit={handleSubmit}>
        {/* Required field note */}
        <div className="w-full mb-2 text-sm text-red-500">* จำเป็นต้องกรอกข้อมูล</div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 w-full">
          <h2 className="text font-bold  md:col-span-2 flex items-center gap-2 ">
            <span className="flex items-center justify-center w-8 h-8 border-2 border-pink-400 rounded-full shrink-0 ">
              1
            </span>
            ข้อมูลผู้ใช้บริการ (Patient Information)
          </h2>
          <div className="grid md:col-span-2 ">
            <Label className="py-2 text-base">เลขบัตรประชาชน 13 หลัก (Thai ID) <span className="text-red-500">*</span></Label>
            <PatternFormat
              id="patientId"
              name="patientId"
              format="#-####-#####-##-#"
              mask="_"
              value={formData.patientId}
              onChange={handleChange}
              className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
            />
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="grid col-span-1">
              <Label className="py-2 text-base">คำนำหน้าชื่อ <span className="text-red-500">*</span></Label>
              <Select
                onValueChange={(value) => handleSelectChange(value, "title")}
                name="title"
                value={formData.title} // Ensure controlled component
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

            <div className="grid col-span-2">
              <Label className="py-2 text-base">ชื่อ (First Name) <span className="text-red-500">*</span></Label>
              <Input
                type="text"
                placeholder="ชื่อ"
                name="first_name"
                value={formData.first_name} // Controlled component
                onChange={handleChange}
              />
            </div>
          </div>
          <div className="grid">
            <Label className="py-2 text-base">นามสกุล (Last Name) <span className="text-red-500">*</span></Label>
            <Input
              type="text"
              placeholder="นามสกุล"
              name="last_name"
              value={formData.last_name} // Controlled component
              onChange={handleChange}
            />
          </div>
          <div className="grid">
            <Label className="py-2 text-base">วัน/เดือน/ปีเกิด (Date of Birth) <span className="text-red-500">*</span></Label>
            <DatePicker
              locale={buddhistLocale}
              className="w-full"
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
          <div className="grid">
            <Label className="py-2 text-base">เบอร์โทรศัพท์ (Phone Number) <span className="text-red-500">*</span></Label>
            <PatternFormat
              id="phone_num"
              name="phone_num"
              format="###-###-####"
              mask="_"
              value={formData.phone_num} // Controlled component
              onChange={handleChange}
              className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
            />
          </div>
          <div className="grid">
            <Label className="py-2 text-base">
              อีเมล (Email){" "}
              <span className="text-sm text-muted-foreground">
                (หากไม่มีให้เว้นว่าง)
              </span>
            </Label>
            <Input
              type="email"
              placeholder="อีเมล"
              name="email"
              value={formData.email || ""} // Controlled component
              onChange={handleChange}
            />
          </div>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 w-full pt-10">
          <h2 className="text font-bold  md:col-span-2 flex items-center gap-2">
            <span className="flex items-center justify-center w-8 h-8 border-2 border-pink-400 rounded-full shrink-0">
              2
            </span>
            ข้อมูลสุขภาพ (Health Information)
          </h2>
          <div className="grid">
            <Label className="py-2 text-base">
              น้ำหนัก (Weight){" "}
              <span className="text-sm text-muted-foreground">(kg)</span>
            </Label>
            <Input
              type="number"
              placeholder="น้ำหนัก"
              name="weight"
              value={formData.weight || ""}
              onChange={handleChange}
            />
          </div>
          <div className="grid">
            <Label className="py-2 text-base">
              ส่วนสูง (Height){" "}
              <span className="text-sm text-muted-foreground">(cm)</span>
            </Label>
            <Input
              type="number"
              placeholder="ส่วนสูง"
              name="height"
              value={formData.height || ""}
              onChange={handleChange}
            />
          </div>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 w-full pt-10">
          <h2 className="text font-bold  md:col-span-2 flex items-center gap-2">
            <span className="flex items-center justify-center w-8 h-8 border-2 border-pink-400 rounded-full shrink-0">
              3
            </span>
            ที่อยู่ (Address)
          </h2>
          <div className="grid md:col-span-2">
            <Label className="py-2 text-base">ที่อยู่ (Address)</Label>
            <Input
              type="text"
              placeholder="บ้านเลขที่, หมู่, ซอย"
              name="address"
              value={formData.address}
              onChange={handleChange}
            />
          </div>
          <div className="grid">
            <Label className="py-2 text-base">ถนน (Road)</Label>
            <Input
              type="text"
              placeholder="ถนน"
              name="road"
              value={formData.road}
              onChange={handleChange}
            />
          </div>
          <div className="grid">
            <Label className="py-2 text-base">ตำบล/แขวง (Sub-district)</Label>
            <Input
              type="text"
              placeholder="ตำบล/แขวง"
              name="sub_district"
              value={formData.sub_district}
              onChange={handleChange}
            />
          </div>
          <div className="grid">
            <Label className="py-2 text-base">อำเภอ/เขต (District)</Label>
            <Input
              type="text"
              placeholder="อำเภอ/เขต"
              name="district"
              value={formData.district}
              onChange={handleChange}
            />
          </div>
          <div className="grid">
            <Label className="py-2 text-base">จังหวัด (Province)</Label>
            <Input
              type="text"
              placeholder="จังหวัด"
              name="province"
              value={formData.province}
              onChange={handleChange}
            />
          </div>
          <div className="grid">
            <Label className="py-2 text-base">รหัสไปรษณีย์ (Postal Code)</Label>
            <Input
              type="text"
              placeholder="รหัสไปรษณีย์"
              name="postal_num"
              value={formData.postal_num}
              onChange={handleChange}
            />
          </div>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 w-full pt-10">
          <h2 className="text font-bold  md:col-span-2 flex items-center gap-2">
            <span className="flex items-center justify-center w-8 h-8 border-2 border-pink-400 rounded-full shrink-0">
              4
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
        <Button type="submit" className="mt-4" disabled={isSubmitting}>
          {isSubmitting ? "กำลังบันทึก..." : "บันทึกข้อมูล"}
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

export default PatientCreateForm;
"use client";
import React from "react";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { PatternFormat } from "react-number-format";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import type { DatePickerProps } from "antd";
import { DatePicker, Space } from "antd";
import { LoadingOutlined, PlusOutlined } from "@ant-design/icons";
import { Flex, message, Upload } from "antd";
import type { GetProp, UploadProps } from "antd";
import { uploadImage } from "@/app/patient-create/_actions/uploadImage";
import { useRouter } from "next/navigation";

function PatientCreateForm(patientId: any) {
  const router = useRouter();
  let patientID: string = patientId.patientId || "";
  const [formData, setFormData] = React.useState({
    patientId: patientID,
    title: "",
    first_name: "",
    last_name: "",
    phone_num: "",
    email: "",
    weight: "",
    height: "",
    address: "",
    road: "",
    sub_district: "",
    district: "",
    province: "",
    postal_num: "",
    date_of_birth: "",
  });
  const [date, setDate] = React.useState<Date>();

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    console.log("formData before submission:", formData);
    try {
      const response = await fetch('/api/v1/patients/createPatient', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          id: formData.patientId.replace(/-/g, ""), // Remove dashes from patientId
          title: formData.title,
          first_name: formData.first_name,
          last_name: formData.last_name,
          date_of_birth: formData.date_of_birth,
          phone_num: formData.phone_num.replace(/-/g, ""),
          email: formData.email ? formData.email : null,
          weight: formData.weight ? parseFloat(formData.weight) : null,
          height: formData.height ? parseFloat(formData.height) : null,
          address: formData.address,
          road: formData.road,
          sub_district: formData.sub_district,
          district: formData.district,
          province: formData.province,
          postal_num: formData.postal_num
        })
      });

      if (response.ok) {
        const data = await response.json();
        console.log('Patient created successfully:', data);
        toast.success('บันทึกข้อมูลสำเร็จ');
        router.push('/');
      } else {
        throw new Error('Failed to create patient');
      }
    } catch (error) {
      console.error('Error creating patient:', error);
      toast.error('เกิดข้อผิดพลาดในการบันทึกข้อมูล');
    }
  }

  function handleChange(event: React.ChangeEvent<HTMLInputElement>) {
    const { name, value } = event.target;
    setFormData((prevData) => ({
      ...prevData,
      [name]: value,
    }));
  }
  const handleDateChange = (date: any, dateString: string | string[]) => {
    console.log("Selected date:", date, "Formatted date string:", dateString);

    // Convert to Date object and then to ISO string format (YYYY-MM-DD)
    const formattedDate = date ? date.format('YYYY-MM-DD') : '';

    setFormData((prevData) => ({
      ...prevData,
      date_of_birth: formattedDate,
    }));
  };
  useEffect(() => {
    console.log("formData updated in useEffect:", formData);
  }, [formData]);

  useEffect(() => {
    setFormData((prevData) => ({
      ...prevData,
      date_of_birth: date ? date.toISOString().split('T')[0] : "",
    }));
  }, [date]);



  type FileType = Parameters<GetProp<UploadProps, "beforeUpload">>[0];

  const getBase64 = (img: FileType, callback: (url: string) => void) => {
    const reader = new FileReader();
    reader.addEventListener("load", () => callback(reader.result as string));
    reader.readAsDataURL(img);
  };

  const beforeUpload = (file: FileType) => {
    const isJpgOrPng = file.type === "image/jpeg" || file.type === "image/png";
    if (!isJpgOrPng) {
      message.error("You can only upload JPG/PNG file!");
      toast.error("คุณสามารถอัปโหลดไฟล์ JPG/PNG เท่านั้น");
    }
    const isLt5M = file.size / 1024 / 1024 < 5;
    if (!isLt5M) {
      message.error("Image must smaller than 5MB!");
      toast.error("ไฟล์รูปภาพต้องมีขนาดไม่เกิน 5 MB");
    }
    return isJpgOrPng && isLt5M;
  };

  // Image Upload
  const [loading, setLoading] = useState(false);
  const [imageUrl, setImageUrl] = useState<string>();

  const handleImageChange: UploadProps["onChange"] = (info) => {
    if (info.file.status === "uploading") {
      setLoading(true);
      return;
    }
    if (info.file.status === "done") {
      // Get this url from response in real world.
      getBase64(info.file.originFileObj as FileType, (url) => {
        setLoading(false);
        setImageUrl(url);
      });
    }
  };

  useEffect(() => {
    if (imageUrl) {
      uploadImage(imageUrl, formData.patientId.replace(/-/g, ""));
      console.log(imageUrl);
    }
  }, [imageUrl]);

  const uploadButton = (
    <button style={{ border: 0, background: "none" }} type="button">
      {loading ? <LoadingOutlined /> : <PlusOutlined />}
      <div style={{ marginTop: 8 }}>อัปโหลดรูปภาพ ระบบรองรับไฟล์นามสกุล .jpg .jpeg .png ขนาดไม่เกิน 5 mb</div>
    </button>
  );
  return (
    <>
      <form className="flex flex-col items-end " onSubmit={handleSubmit}>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 w-full">
          <h2 className="text font-bold  md:col-span-2 flex items-center gap-2 ">
            <span className="flex items-center justify-center w-8 h-8 border-2 border-pink-400 rounded-full shrink-0 ">
              1
            </span>
            ข้อมูลผู้ใช้บริการ (Patient Information)
          </h2>
          <div className="grid md:col-span-2 ">
            <Label className="py-2 text-base">เลขบัตรประชาชน 13 หลัก (Thai ID)</Label>
            <PatternFormat
              id="patientId"
              name="patientId"
              format="#-####-#####-##-#"
              mask="_"
              value={patientID}
              onChange={handleChange}
              className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
            />
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="grid col-span-1">
              <Label className="py-2 text-base">คำนำหน้าชื่อ</Label>
              <Select
                onValueChange={(value: string) =>
                  setFormData((prevData) => ({ ...prevData, title: value }))
                }
                name="title"
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
              <Label className="py-2 text-base">ชื่อ (First Name)</Label>
              <Input
                type="text"
                placeholder="ชื่อ"
                name="first_name"
                onChange={handleChange}
              />
            </div>
          </div>
          <div className="grid">
            <Label className="py-2 text-base">นามสกุล (Last Name)</Label>
            <Input
              type="text"
              placeholder="นามสกุล"
              name="last_name"
              onChange={handleChange}
            />
          </div>
          <div className="grid">
            <Label className="py-2 text-base">วัน/เดือน/ปีเกิด (Date of Birth) </Label>
            <DatePicker name="date_of_birth" onChange={handleDateChange} format={"DD MMM YYYY"} />
          </div>
          <div className="grid">
            <Label className="py-2 text-base">เบอร์โทรศัพท์ (Phone Number)</Label>
            <PatternFormat
              id="phone_num"
              name="phone_num"
              format="###-###-####"
              mask="_"
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
              onChange={handleChange}
            />
          </div>
          <div className="grid">
            <Label htmlFor="weight" className="py-2">
              น้ำหนัก (Weight){" "}
              <span className="text-sm text-muted-foreground">(หน่วย kg)</span>
            </Label>
            <Input
              id="weight"
              name="weight"
              type="number"
              step="0.01"
              placeholder="น้ำหนัก (kg)"
              onChange={handleChange}
            />
          </div>
          <div className="grid">
            <Label htmlFor="height" className="py-2">
              ส่วนสูง (Height)
              <span className="text-sm text-muted-foreground">(หน่วย cm)</span>
            </Label>
            <Input
              id="height"
              name="height"
              type="number"
              step="0.01"
              placeholder="ส่วนสูง (cm)"
              onChange={handleChange}
            />
          </div>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 w-full pt-8">
          <h2 className="text font-bold md:col-span-2 flex items-center gap-2 ">
            <span className="flex items-center justify-center w-8 h-8 border-2 border-pink-400 rounded-full shrink-0 ">
              2
            </span>
            ข้อมูลที่อยู่ (Address Information)
          </h2>
          <div className="grid">
            <Label className="py-2 text-base">ที่อยู่ (Address)</Label>
            <Input
              type="text"
              placeholder="12/1 หมู่บ้านแสนสุข ซอย 1"
              name="address"
              onChange={handleChange}
            />
          </div>

          <div className="grid">
            <Label className="py-2 text-base">ถนน (Road)</Label>
            <Input
              type="text"
              placeholder="ถนน"
              name="road"
              onChange={handleChange}
            />
          </div>
          <div className="grid">
            <Label className="py-2 text-base">ตำบล/แขวง (Subdistrict)</Label>
            <Input
              type="text"
              placeholder="ตำบล/แขวง"
              name="sub_district"
              onChange={handleChange}
            />
          </div>
          <div className="grid">
            <Label className="py-2 text-base">อำเภอ/เขต (District)</Label>
            <Input
              type="text"
              placeholder="อำเภอ/เขต"
              name="district"
              onChange={handleChange}
            />
          </div>
          <div className="grid">
            <Label className="py-2 text-base">จังหวัด (Province)</Label>
            <Input
              type="text"
              placeholder="จังหวัด"
              name="province"
              onChange={handleChange}
            />
          </div>
          <div className="grid">
            <Label className="py-2 text-lg">รหัสไปรษณีย์ (Postal Number)</Label>
            <Input
              type="text"
              placeholder="รหัสไปรษณีย์"
              name="postal_num"
              onChange={handleChange}
            />
          </div>
        </div>
        <div className="grid grid-cols-1 gap-4 w-full pt-8 justify-center">
          <h2 className="text font-bold md:col-span-2 flex items-center gap-2 ">
            <span className="flex items-center justify-center w-8 h-8 border-2 border-pink-400 rounded-full shrink-0 ">
              3
            </span>
            อัปโหลดรูปภาพ (Upload Image)
          </h2>

          <div className="flex w-full md:w-1/2 h-auto justify-center items-center mx-auto">
            <Upload
              name="avatar"
              listType="picture-card"
              className="avatar-uploader w-full h-auto"
              showUploadList={false}
              beforeUpload={beforeUpload}
              onChange={handleImageChange}
              style={{ width: '100%', height: 'auto' }}
            >
              {imageUrl ? (
                <div>
                  <img src={imageUrl} alt="avatar" style={{ width: "100%", height: "auto" }} />
                  <p className="text-sm py-2">กดที่นี้เพื่อเปลี่ยนรูปภาพ/อัปโหลดใหม่</p>
                </div>
              ) : (
                uploadButton
              )}
            </Upload>
          </div>
        </div>
        {/* Action Buttons */}
        <div className="flex justify-between w-full pt-8 gap-4">
          <Button
            type="button"
            variant="outline"
            className="flex items-center gap-2"
            onClick={() => router.push("/")}
          >
            ← กลับ
          </Button>

          <Button
            type="submit"
            className="flex items-center gap-2 bg-pink-500 hover:bg-pink-600"
            onClick={() => handleSubmit}
          >
            บันทึกข้อมูล →
          </Button>
        </div>
      </form>



    </>
  );
}

export default PatientCreateForm;

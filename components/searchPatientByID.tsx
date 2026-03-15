"use client";

import { PatternFormat } from "react-number-format";
import { searchPatientByID, searchPatients, PatientSearchResult } from "@/app/(main)/_actions/patientFormAction";
import { toast } from "sonner";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Card, CardContent } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Search, Plus, AlertTriangle, User, Phone, MapPin, Calendar, Users, ChevronsDown } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState, useEffect, useCallback, useRef } from "react";
import { toThaiDate, toThaiDateTime } from '@/lib/timezone';

// Highlight matched text component
function HighlightedText({ text, search }: { text: string; search: string }) {
  if (!search || !text) return <>{text}</>;

  const parts = text.split(new RegExp(`(${search})`, 'gi'));
  
  return (
    <>
      {parts.map((part, i) => 
        part.toLowerCase() === search.toLowerCase() ? (
          <mark key={i} className="bg-pink-200 text-pink-900 rounded px-0.5">
            {part}
          </mark>
        ) : (
          <span key={i}>{part}</span>
        )
      )}
    </>
  );
}

// Patient search result card (compact)
function PatientCard({ patient, searchQuery, onClick }: {
  patient: PatientSearchResult;
  searchQuery: string;
  onClick: () => void;
}) {
  const fullName = `${patient.title || ''}${patient.first_name} ${patient.last_name}`.trim();
  const initial = `${patient.first_name[0]}${patient.last_name[0]}`;

  return (
    <div
      className="flex items-center gap-3 px-3 py-2 rounded-md cursor-pointer hover:bg-accent transition-colors"
      onClick={onClick}
    >
      <Avatar className="h-9 w-9 shrink-0">
        <AvatarImage src={patient.profile_image_url} alt={fullName} />
        <AvatarFallback className="text-xs">{initial}</AvatarFallback>
      </Avatar>

      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2">
          <span className="font-medium text-sm truncate">
            <HighlightedText text={fullName} search={searchQuery} />
          </span>
          {patient.matchedFields.includes('id') && (
            <Badge variant="secondary" className="text-[10px] px-1.5 py-0">ID</Badge>
          )}
        </div>
        <div className="flex items-center gap-3 text-xs text-muted-foreground">
          {patient.matchedFields.includes('id') && (
            <span className="flex items-center gap-1">
              <User className="h-3 w-3" />
              <HighlightedText text={patient.id} search={searchQuery} />
            </span>
          )}
          {patient.phone_num && (
            <span className="flex items-center gap-1">
              <Phone className="h-3 w-3" />
              <HighlightedText text={patient.phone_num} search={searchQuery} />
            </span>
          )}
          {patient.date_of_birth && (
            <span className="flex items-center gap-1">
              <Calendar className="h-3 w-3" />
              {toThaiDate(patient.date_of_birth)}
            </span>
          )}
          {patient.caregiver_name && patient.matchedFields.includes('caregiver_name') && (
            <span className="flex items-center gap-1">
              <Users className="h-3 w-3" />
              <HighlightedText text={patient.caregiver_name} search={searchQuery} />
            </span>
          )}
          {patient.address && patient.matchedFields.includes('address') && (
            <span className="flex items-center gap-1 truncate">
              <MapPin className="h-3 w-3" />
              <HighlightedText text={patient.address} search={searchQuery} />
            </span>
          )}
        </div>
      </div>
    </div>
  );
}

export function PatientIdInput() {
  const router = useRouter();
  const [showDialog, setShowDialog] = useState(false);
  const [currentPatientId, setCurrentPatientId] = useState("");
  const [showDeletedDialog, setShowDeletedDialog] = useState(false);
  const [deletedPatientInfo, setDeletedPatientInfo] = useState<{
    scheduledDeleteAt: string;
    daysRemaining: number;
  } | null>(null);

  // New states for search
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState<PatientSearchResult[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [showSearchResults, setShowSearchResults] = useState(false);
  const searchTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // Debounced search function
  const handleSearchChange = useCallback((value: string) => {
    setSearchQuery(value);
    setShowSearchResults(true);

    if (searchTimeoutRef.current) {
      clearTimeout(searchTimeoutRef.current);
    }

    if (value.trim().length < 2) {
      setSearchResults([]);
      setIsSearching(false);
      return;
    }

    setIsSearching(true);
    searchTimeoutRef.current = setTimeout(async () => {
      try {
        const results = await searchPatients(value);
        setSearchResults(results);
      } catch (error) {
        console.error("Search error:", error);
        toast.error("เกิดข้อผิดพลาดในการค้นหา");
      } finally {
        setIsSearching(false);
      }
    }, 300);
  }, []);

  const handleSelectPatient = (patientId: string) => {
    setShowSearchResults(false);
    setSearchQuery("");
    setSearchResults([]);
    router.push(`/patient/${patientId}/home`);
  };

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const formData = new FormData(event.currentTarget);
    let patientID = formData.get("patientId") as string;
    patientID = patientID.replace(/-/g, ""); // Remove dashes

    if (patientID.length !== 13) {
      toast.error("กรุณากรอกเลขบัตรประชาชน 13 หลัก");
      return;
    }

    try {
      const patient = await searchPatientByID(patientID);

      if (patient && patient.id) {
        // Check if patient is soft deleted
        if (patient.isSoftDeleted) {
          const deletionDate = new Date(patient.scheduled_permanent_delete_at);
          const daysRemaining = Math.ceil((deletionDate.getTime() - Date.now()) / (1000 * 60 * 60 * 24));
          
          setDeletedPatientInfo({
            scheduledDeleteAt: toThaiDate(patient.scheduled_permanent_delete_at),
            daysRemaining,
          });
          setShowDeletedDialog(true);
          return;
        }
        
        router.push(`/patient/${patient.id}/home`);
      } else {
        // Show dialog instead of toast
        setCurrentPatientId(patientID);
        setShowDialog(true);
      }
    } catch (error) {
      console.error("พบปัญหาระหว่างค้นข้อมูลผู้ใช้บริการ : ", error);
      toast.error("เกิดข้อผิดพลาดในการค้นหาข้อมูลผู้ใช้บริการ", {
        description: String(error),
      });
    }
  }

  function handleCreateNewPatient() {
    setShowDialog(false);
    router.push(`/patient-create?patientId=${currentPatientId}`);
  }

  function handleCloseDialog() {
    setShowDialog(false);
    setCurrentPatientId("");
  }

  return (
    <>
      {/* Quick Search Input */}
      <div className="relative">
        <div className="flex items-center justify-between mb-2">
          <Label htmlFor="quickSearch">
            ค้นหาผู้ใช้บริการ (ชื่อ, เบอร์โทร, ที่อยู่, ผู้ดูแล, รหัสไปรษณีย์, เลขบัตรประชาชน)
          </Label>
          <Button 
            variant="default" 
            size="sm"
            onClick={() => router.push('/patient-create')}
            className="gap-2"
          >
            <Plus className="h-4 w-4" />
            สร้างผู้ใช้บริการใหม่
          </Button>
        </div>
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            id="quickSearch"
            type="text"
            placeholder="พิมพ์เพื่อค้นหา..."
            value={searchQuery}
            onChange={(e) => handleSearchChange(e.target.value)}
            onFocus={() => setShowSearchResults(true)}
            className="pl-10"
          />
        </div>

        {/* Search Results Dropdown */}
        {showSearchResults && (searchResults.length > 0 || isSearching) && (
          <div className="absolute z-50 w-full mt-2 bg-background border rounded-lg shadow-lg max-h-80 overflow-y-auto">
            {isSearching ? (
              <div className="p-4 text-center text-muted-foreground">
                <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-primary mx-auto mb-2"></div>
                กำลังค้นหา...
              </div>
            ) : (
              <>
                <div className="sticky top-0 bg-background border-b px-3 py-2 flex items-center justify-between text-xs text-muted-foreground">
                  <span>พบ {searchResults.length} ผลลัพธ์</span>
                  {searchResults.length > 5 && (
                    <span className="flex items-center gap-1">
                      <ChevronsDown className="h-3 w-3" />
                      เลื่อนลงเพื่อดูเพิ่มเติม
                    </span>
                  )}
                </div>
                <div className="py-1">
                  {searchResults.map((patient) => (
                    <PatientCard
                      key={patient.id}
                      patient={patient}
                      searchQuery={searchQuery}
                      onClick={() => handleSelectPatient(patient.id)}
                    />
                  ))}
                </div>
              </>
            )}
          </div>
        )}

        {showSearchResults && searchQuery.length >= 2 && searchResults.length === 0 && !isSearching && (
          <div className="absolute z-50 w-full mt-2 bg-background border rounded-lg shadow-lg p-4 text-center text-muted-foreground">
            ไม่พบผู้ใช้บริการที่ตรงกับการค้นหา
          </div>
        )}
      </div>

      {/* Original ID Search - Commented out but kept for reference */}
      {/* <form className="flex items-end" onSubmit={handleSubmit}>
        <div className="flex-1">
          <Label htmlFor="patientId" className="py-2">
            หรือค้นหาด้วยเลขบัตรประชาชน 13 หลัก
          </Label>
          <PatternFormat
            id="patientId"
            name="patientId"
            format="#-####-#####-##-#"
            mask="_"
            className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
          />
        </div>
        <Button type="submit" className="mx-2 h-auto">
          <Search className="h-4 w-4 mr-2" />
          Search
        </Button>
      </form> */}

      <Dialog open={showDialog} onOpenChange={setShowDialog}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <AlertTriangle className="h-5 w-5 text-amber-500" />
              ไม่พบข้อมูลผู้ใช้บริการ
            </DialogTitle>
            <DialogDescription>
              ไม่พบข้อมูลผู้ใช้บริการนี้ในระบบ กรุณาสร้างผู้ใช้บริการใหม่
            </DialogDescription>
          </DialogHeader>
          <div className="py-4">
            <p className="text-sm text-muted-foreground">
              เลขบัตรประชาชน: <span className="font-medium">{currentPatientId}</span>
            </p>
          </div>
          <DialogFooter className="gap-2">
            <Button variant="outline" onClick={handleCloseDialog}>
              ยกเลิก
            </Button>
            <Button onClick={handleCreateNewPatient} className="gap-2">
              <Plus className="h-4 w-4" />
              สร้างผู้ใช้บริการใหม่
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={showDeletedDialog} onOpenChange={setShowDeletedDialog}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <AlertTriangle className="h-5 w-5 text-red-500" />
              ผู้ใช้บริการถูกลบโดยผู้ดูแลระบบ
            </DialogTitle>
            <DialogDescription>
              ข้อมูลผู้ใช้บริการนี้ถูกลบโดยผู้ดูแลระบบแล้ว
            </DialogDescription>
          </DialogHeader>
          <div className="py-4 space-y-3">
            <div className="rounded-lg border border-red-200 bg-red-50 p-4">
              <p className="text-sm font-medium text-red-900 mb-2">
                ข้อมูลจะถูกลบถาวรในอีก {deletedPatientInfo?.daysRemaining} วัน
              </p>
              <p className="text-sm text-red-700">
                วันที่ลบถาวร: {deletedPatientInfo?.scheduledDeleteAt}
              </p>
            </div>
            <p className="text-sm text-muted-foreground">
              กรุณาติดต่อผู้ดูแลระบบเพื่อขอข้อมูลเพิ่มเติม
            </p>
          </div>
          <DialogFooter>
            <Button onClick={() => setShowDeletedDialog(false)}>
              ปิด
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}

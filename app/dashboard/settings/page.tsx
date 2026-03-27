'use client'

import { useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Switch } from '@/components/ui/switch'
import { Badge } from '@/components/ui/badge'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  User,
  Globe,
  DollarSign,
  Bell,
  Shield,
  Save,
  Check,
  Languages,
} from 'lucide-react'
import { useLanguage } from '@/lib/i18n/context'

export default function SettingsPage() {
  const { locale, setLocale } = useLanguage()

  // Profile state
  const [displayName, setDisplayName] = useState('')
  const [email, setEmail] = useState('')
  const [profileSaved, setProfileSaved] = useState(false)

  // Preferences state
  const [currency, setCurrency] = useState('SAR')
  const [dateFormat, setDateFormat] = useState('dd/mm/yyyy')
  const [prefSaved, setPrefSaved] = useState(false)

  // Notification preferences
  const [notifMaturity, setNotifMaturity] = useState(true)
  const [notifOverdue, setNotifOverdue] = useState(true)
  const [notifNewInvestment, setNotifNewInvestment] = useState(false)

  const handleSaveProfile = () => {
    // Ready for data binding — persist to Supabase profiles table
    setProfileSaved(true)
    setTimeout(() => setProfileSaved(false), 2500)
  }

  const handleSavePreferences = () => {
    // Ready for data binding — persist user preferences
    setPrefSaved(true)
    setTimeout(() => setPrefSaved(false), 2500)
  }

  return (
    <div className="space-y-6 max-w-3xl">
      {/* Page header */}
      <div>
        <h1 className="text-3xl font-bold text-gray-900">الإعدادات</h1>
        <p className="text-gray-500 mt-1">إدارة حسابك وتفضيلات التطبيق</p>
      </div>

      {/* ── Section 1: Profile Information ── */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <User className="h-5 w-5 text-blue-600" />
            معلومات الملف الشخصي
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-5">
          {/* Avatar row */}
          <div className="flex items-center gap-4">
            <div className="h-16 w-16 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center flex-shrink-0">
              <User className="h-8 w-8 text-white" />
            </div>
            <div>
              <p className="text-sm font-medium text-gray-900">صورة الملف الشخصي</p>
              <p className="text-xs text-gray-500 mt-0.5">سيتم دعم رفع الصور في التحديث القادم</p>
              <Badge variant="outline" className="mt-1 text-xs text-gray-400 border-gray-200">
                قريباً
              </Badge>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="display-name">الاسم المعروض</Label>
              <Input
                id="display-name"
                placeholder="أدخل اسمك الكامل"
                value={displayName}
                onChange={(e) => setDisplayName(e.target.value)}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="email">البريد الإلكتروني</Label>
              <Input
                id="email"
                type="email"
                placeholder="example@email.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                dir="ltr"
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="phone">رقم الجوال (اختياري)</Label>
            <Input
              id="phone"
              type="tel"
              placeholder="+966 5X XXX XXXX"
              dir="ltr"
            />
          </div>

          {/* Security info */}
          <div className="flex items-start gap-3 p-3 bg-blue-50 rounded-lg border border-blue-100">
            <Shield className="h-4 w-4 text-blue-500 mt-0.5 flex-shrink-0" />
            <div>
              <p className="text-sm font-medium text-blue-800">تغيير كلمة المرور</p>
              <p className="text-xs text-blue-600 mt-0.5">
                يمكنك تغيير كلمة المرور من خلال خيار "نسيت كلمة المرور" في صفحة تسجيل الدخول
              </p>
            </div>
          </div>

          <div className="flex justify-end">
            <Button
              onClick={handleSaveProfile}
              className="bg-blue-600 hover:bg-blue-700 gap-2"
            >
              {profileSaved ? (
                <><Check className="h-4 w-4" /> تم الحفظ</>
              ) : (
                <><Save className="h-4 w-4" /> حفظ التغييرات</>
              )}
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* ── Section 2: App Preferences ── */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Globe className="h-5 w-5 text-purple-600" />
            تفضيلات التطبيق
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Language */}
          <div className="flex items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className="h-9 w-9 rounded-lg bg-purple-50 flex items-center justify-center flex-shrink-0">
                <Languages className="h-4 w-4 text-purple-600" />
              </div>
              <div>
                <p className="text-sm font-medium text-gray-900">لغة التطبيق</p>
                <p className="text-xs text-gray-500">تغيير لغة الواجهة</p>
              </div>
            </div>
            <Select
              value={locale}
              onValueChange={(v) => setLocale(v as 'en' | 'ar')}
            >
              <SelectTrigger className="w-36">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="ar">العربية 🇸🇦</SelectItem>
                <SelectItem value="en">English 🇬🇧</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <hr className="border-gray-100" />

          {/* Currency */}
          <div className="flex items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className="h-9 w-9 rounded-lg bg-emerald-50 flex items-center justify-center flex-shrink-0">
                <DollarSign className="h-4 w-4 text-emerald-600" />
              </div>
              <div>
                <p className="text-sm font-medium text-gray-900">العملة الافتراضية</p>
                <p className="text-xs text-gray-500">العملة المستخدمة في عرض المبالغ</p>
              </div>
            </div>
            <Select value={currency} onValueChange={setCurrency}>
              <SelectTrigger className="w-36">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="SAR">ريال سعودي (SAR)</SelectItem>
                <SelectItem value="USD">دولار أمريكي (USD)</SelectItem>
                <SelectItem value="EUR">يورو (EUR)</SelectItem>
                <SelectItem value="AED">درهم إماراتي (AED)</SelectItem>
                <SelectItem value="KWD">دينار كويتي (KWD)</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <hr className="border-gray-100" />

          {/* Date format */}
          <div className="flex items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className="h-9 w-9 rounded-lg bg-blue-50 flex items-center justify-center flex-shrink-0">
                <Globe className="h-4 w-4 text-blue-600" />
              </div>
              <div>
                <p className="text-sm font-medium text-gray-900">تنسيق التاريخ</p>
                <p className="text-xs text-gray-500">الطريقة المفضلة لعرض التواريخ</p>
              </div>
            </div>
            <Select value={dateFormat} onValueChange={setDateFormat}>
              <SelectTrigger className="w-36">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="dd/mm/yyyy">DD/MM/YYYY</SelectItem>
                <SelectItem value="mm/dd/yyyy">MM/DD/YYYY</SelectItem>
                <SelectItem value="yyyy-mm-dd">YYYY-MM-DD</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="flex justify-end">
            <Button
              onClick={handleSavePreferences}
              className="bg-purple-600 hover:bg-purple-700 gap-2"
            >
              {prefSaved ? (
                <><Check className="h-4 w-4" /> تم الحفظ</>
              ) : (
                <><Save className="h-4 w-4" /> حفظ التفضيلات</>
              )}
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* ── Section 3: Notification Preferences ── */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Bell className="h-5 w-5 text-amber-600" />
            تفضيلات الإشعارات
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between py-2">
            <div>
              <p className="text-sm font-medium text-gray-900">تنبيه استحقاق الاستثمارات</p>
              <p className="text-xs text-gray-500">إشعار عند اقتراب تاريخ استحقاق أي استثمار</p>
            </div>
            <Switch
              checked={notifMaturity}
              onCheckedChange={setNotifMaturity}
            />
          </div>

          <hr className="border-gray-100" />

          <div className="flex items-center justify-between py-2">
            <div>
              <p className="text-sm font-medium text-gray-900">تنبيه الاستثمارات المتأخرة</p>
              <p className="text-xs text-gray-500">إشعار عند تجاوز تاريخ الاستحقاق</p>
            </div>
            <Switch
              checked={notifOverdue}
              onCheckedChange={setNotifOverdue}
            />
          </div>

          <hr className="border-gray-100" />

          <div className="flex items-center justify-between py-2">
            <div>
              <p className="text-sm font-medium text-gray-900">إشعارات الاستثمارات الجديدة</p>
              <p className="text-xs text-gray-500">إشعار عند إنشاء استثمار جديد</p>
            </div>
            <Switch
              checked={notifNewInvestment}
              onCheckedChange={setNotifNewInvestment}
            />
          </div>

          <div className="mt-2 flex items-start gap-2 p-3 bg-amber-50 rounded-lg border border-amber-100">
            <Bell className="h-4 w-4 text-amber-500 mt-0.5 flex-shrink-0" />
            <p className="text-xs text-amber-700">
              سيتم تفعيل إرسال الإشعارات التلقائية في تحديث قادم — هذه الإعدادات جاهزة للربط
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

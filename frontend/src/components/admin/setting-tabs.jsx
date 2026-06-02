'use client'

import React, { useState } from 'react'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import {
  Settings,
  Palette,
  MapPinCheck,
  FileCodeCorner,
} from 'lucide-react'

import AdminSettings from '@/components/admin/settings'
import PurokSettings from '@/components/admin/purok-settings'
import DocumentTypeSettings from '@/components/admin/document-settings'
export default function AdminTabs({ settings, emailConfigs, priorities, statuses }) {
  const [activeTab, setActiveTab] = useState('general')

  return (
    <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
      <TabsList className="w-full grid grid-cols-7 h-auto p-1">
        <TabTrigger value="general" icon={Settings} label="General" className="flex items-center justify-center gap-2 whitespace-nowrap px-2 py-2 min-w-0" />
        <TabTrigger value="customize" icon={Palette} label="Customize" />
        <TabTrigger value="queues" icon={MapPinCheck} label="Purok" />
        <TabTrigger value="email" icon={FileCodeCorner} label="Documents" />

      </TabsList>

      <TabsContent value="general" className="mt-6">
        <AdminSettings settings={settings} tabMode="general" />
      </TabsContent>

      <TabsContent value="customize" className="mt-6">
        <AdminSettings settings={settings} tabMode="customize" />
      </TabsContent>

      <TabsContent value="queues" className="mt-6">
        <PurokSettings settings={settings} tabMode="queues" />
      </TabsContent>

      <TabsContent value="email" className="mt-6">
        <DocumentTypeSettings />
      </TabsContent>

      <TabsContent value="templates" className="mt-6">
  
      </TabsContent>

      <TabsContent value="workflow" className="mt-6">
     
      </TabsContent>

      <TabsContent value="automation" className="mt-6">
     
      </TabsContent>
    </Tabs>
  )
}

function TabTrigger({ value, icon: Icon, label }) {
  return (
    <TabsTrigger
      value={value}
      className="flex items-center gap-2 justify-center"
    >
      <Icon className="h-4 w-4" />
      <span className="hidden sm:inline">{label}</span>
    </TabsTrigger>
  )
}

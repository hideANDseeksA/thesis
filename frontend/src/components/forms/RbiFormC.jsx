import { useEffect, useState, useRef } from 'react'
import { Loader2, AlertCircle, CheckCircle2 } from 'lucide-react'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { apiWithLoading } from '@/lib/axios'
import {
  pdf,
  Document,
  Page,
  Text,
  View,
  StyleSheet,
} from '@react-pdf/renderer'

// ─── constants ────────────────────────────────────────────────────────────────

const AGE_BRACKETS = [
  { label: 'Under 5 years old',     key: 'under 5 years old' },
  { label: '5–9 years old',         key: '5-9 years old' },
  { label: '10–14 years old',       key: '10-14 years old' },
  { label: '15–19 years old',       key: '15-19 years old' },
  { label: '20–24 years old',       key: '20-24 years old' },
  { label: '25–29 years old',       key: '25-29 years old' },
  { label: '30–34 years old',       key: '30-34 years old' },
  { label: '35–39 years old',       key: '35-39 years old' },
  { label: '40–44 years old',       key: '40-44 years old' },
  { label: '45–49 years old',       key: '45-49 years old' },
  { label: '50–54 years old',       key: '50-54 years old' },
  { label: '55–59 years old',       key: '55-59 years old' },
  { label: '60–64 years old',       key: '60-64 years old' },
  { label: '65–69 years old',       key: '65-69 years old' },
  { label: '70–74 years old',       key: '70-74 years old' },
  { label: '75–79 years old',       key: '75-79 years old' },
  { label: '80 years old and over', key: '80 years old and over' },
]

const SECTORS = [
  { label: 'Labor force / employed', key: 'laborForceEmployed' },
  { label: 'Unemployed',             key: 'unemployed' },
]

const CIVIL_STATUS = [
  { label: 'Single',        key: 'single' },
  { label: 'Married',       key: 'married' },
  { label: 'Widow/Widower', key: 'widow' },
  { label: 'Separated',     key: 'separated' },
  { label: 'Annulled',      key: 'annulled' },
  { label: 'Co-habitation', key: 'coHabitation' },
]

const CITIZENSHIP = [
  { label: 'Filipino',         key: 'filipino' },
  { label: 'Dual citizenship', key: 'dualCitizenship' },
  { label: 'Foreigner',        key: 'foreigner' },
]

const emptyMF     = () => ({ male: 0, female: 0 })
const initAgeData = () => Object.fromEntries(AGE_BRACKETS.map(b => [b.key, emptyMF()]))
const initSecData = () => Object.fromEntries(SECTORS.map(s => [s.key, emptyMF()]))
const initCivData = () => Object.fromEntries(CIVIL_STATUS.map(c => [c.key, emptyMF()]))
const initCitData = () => Object.fromEntries(CITIZENSHIP.map(c => [c.key, emptyMF()]))

// ─── PDF styles ───────────────────────────────────────────────────────────────

const S = StyleSheet.create({
  page:        { padding: '1.5cm', fontFamily: 'Helvetica', fontSize: 8, color: '#111' },
  h1:          { fontSize: 10, fontFamily: 'Helvetica-Bold', textAlign: 'center', textTransform: 'uppercase', marginBottom: 2 },
  sub:         { fontSize: 8, textAlign: 'center', color: '#555', marginBottom: 2 },
  period:      { fontSize: 9, fontFamily: 'Helvetica-Bold', textAlign: 'center', marginBottom: 2 },
  periodLight: { fontSize: 8, textAlign: 'center', marginBottom: 10 },
  hr:          { borderBottomWidth: 1.5, borderBottomColor: '#111', marginBottom: 10 },

  metaGrid:  { flexDirection: 'row', flexWrap: 'wrap', borderWidth: 0.5, borderColor: '#bbb', padding: 6, marginBottom: 8, backgroundColor: '#fafafa' },
  metaRow:   { width: '50%', flexDirection: 'row', marginBottom: 2 },
  metaLabel: { width: 90, color: '#666', fontSize: 7.5 },
  metaValue: { flex: 1, fontSize: 7.5 },

  statsRow:  { flexDirection: 'row', gap: 6, marginBottom: 10 },
  statBox:   { flex: 1, borderWidth: 0.5, borderColor: '#ccc', padding: 5, alignItems: 'center' },
  statLabel: { fontSize: 6.5, color: '#666', textTransform: 'uppercase', marginBottom: 2 },
  statValue: { fontSize: 14, fontFamily: 'Helvetica-Bold' },

  sectionTitle: { fontSize: 7.5, fontFamily: 'Helvetica-Bold', textTransform: 'uppercase', letterSpacing: 0.8, borderBottomWidth: 1, borderBottomColor: '#333', paddingBottom: 2, marginTop: 10, marginBottom: 4 },

  // table
  tableHeader:    { flexDirection: 'row', backgroundColor: '#ddd', borderWidth: 0.5, borderColor: '#bbb' },
  tableRow:       { flexDirection: 'row', borderBottomWidth: 0.5, borderColor: '#ddd' },
  tableRowEven:   { flexDirection: 'row', borderBottomWidth: 0.5, borderColor: '#ddd', backgroundColor: '#f7f7f7' },
  tableRowTotal:  { flexDirection: 'row', backgroundColor: '#e8e8e8', borderTopWidth: 1, borderTopColor: '#999' },
  tableRowSubhdr: { flexDirection: 'row', backgroundColor: '#d4d4d4' },

  thLabel: { flex: 2.5, padding: 3, fontSize: 7, fontFamily: 'Helvetica-Bold', textTransform: 'uppercase' },
  thNum:   { width: 44, padding: 3, fontSize: 7, fontFamily: 'Helvetica-Bold', textTransform: 'uppercase', textAlign: 'center' },
  thRem:   { width: 60, padding: 3, fontSize: 7, fontFamily: 'Helvetica-Bold', textTransform: 'uppercase', textAlign: 'center' },

  tdLabel:    { flex: 2.5, padding: '2 3', fontSize: 7.5 },
  tdNum:      { width: 44, padding: '2 3', fontSize: 7.5, textAlign: 'center' },
  tdRem:      { width: 60, padding: '2 3', fontSize: 7.5 },
  tdSubhdr:   { flex: 1, padding: '2 5', fontSize: 7, fontFamily: 'Helvetica-Bold', textTransform: 'uppercase', letterSpacing: 0.5 },
  tdTotLabel: { flex: 2.5, padding: '3 3', fontSize: 7.5, fontFamily: 'Helvetica-Bold' },
  tdTotNum:   { width: 44, padding: '3 3', fontSize: 7.5, fontFamily: 'Helvetica-Bold', textAlign: 'center' },
  tdTotRem:   { width: 60, padding: '3 3' },

  blue: { color: '#1a5fa8' },
  pink: { color: '#b92f5e' },

  sigRow:  { flexDirection: 'row', gap: 30, marginTop: 30 },
  sigBox:  { flex: 1 },
  sigLine: { borderTopWidth: 0.5, borderTopColor: '#333', paddingTop: 3, fontSize: 7, textAlign: 'center', marginTop: 28 },
})

// ─── PDF document component ───────────────────────────────────────────────────

function RbiPdfDocument({
  semester, year, region, province, cityMun, barangay,
  totalInhab, totalHH, totalFam,
  ageData, secData, civData, citData,
  ageM, ageF, secM, secF, civM, civF, citM, citF,
}) {
  const semLabel = semester === '1' ? '1st Semester' : '2nd Semester'
  const displayTotal = totalInhab || (ageM + ageF)

  const TableHead = () => (
    <View style={S.tableHeader}>
      <Text style={S.thLabel}>Indicator</Text>
      <Text style={[S.thNum, S.blue]}>Male</Text>
      <Text style={[S.thNum, S.pink]}>Female</Text>
      <Text style={S.thNum}>Total</Text>
      <Text style={S.thRem}>Remarks</Text>
    </View>
  )

  const TableHeadCustom = ({ label }) => (
    <View style={S.tableHeader}>
      <Text style={S.thLabel}>{label}</Text>
      <Text style={[S.thNum, S.blue]}>Male</Text>
      <Text style={[S.thNum, S.pink]}>Female</Text>
      <Text style={S.thNum}>Total</Text>
      <Text style={S.thRem}>Remarks</Text>
    </View>
  )

  const DataRows = ({ items, data }) =>
    items.map((item, i) => {
      const m = data[item.key]?.male   || 0
      const f = data[item.key]?.female || 0
      return (
        <View key={item.key} style={i % 2 === 0 ? S.tableRow : S.tableRowEven}>
          <Text style={S.tdLabel}>{item.label}</Text>
          <Text style={S.tdNum}>{m}</Text>
          <Text style={S.tdNum}>{f}</Text>
          <Text style={S.tdNum}>{m + f}</Text>
          <Text style={S.tdRem}></Text>
        </View>
      )
    })

  const TotalRow = ({ label, m, f }) => (
    <View style={S.tableRowTotal}>
      <Text style={S.tdTotLabel}>{label}</Text>
      <Text style={[S.tdTotNum, S.blue]}>{m}</Text>
      <Text style={[S.tdTotNum, S.pink]}>{f}</Text>
      <Text style={S.tdTotNum}>{m + f}</Text>
      <Text style={S.tdTotRem}></Text>
    </View>
  )

  const SubHeader = ({ label }) => (
    <View style={S.tableRowSubhdr}>
      <Text style={S.tdSubhdr}>{label}</Text>
    </View>
  )

  return (
    <Document>
      <Page size="A4" style={S.page}>
        <Text style={S.period}>Smart Barangay Generated Reports</Text>
        <View style={S.hr} />

        {/* Meta info */}
        <View style={S.metaGrid}>
          <View style={S.metaRow}><Text style={S.metaLabel}>Region:</Text><Text style={S.metaValue}>{region || '—'}</Text></View>
          <View style={S.metaRow}><Text style={S.metaLabel}>Province:</Text><Text style={S.metaValue}>{province || '—'}</Text></View>
          <View style={S.metaRow}><Text style={S.metaLabel}>City/Municipality:</Text><Text style={S.metaValue}>{cityMun || '—'}</Text></View>
          <View style={S.metaRow}><Text style={S.metaLabel}>Barangay:</Text><Text style={S.metaValue}>{barangay || '—'}</Text></View>
          <View style={S.metaRow}><Text style={S.metaLabel}>Total inhabitants:</Text><Text style={S.metaValue}>{displayTotal}</Text></View>
          <View style={S.metaRow}><Text style={S.metaLabel}>Total households:</Text><Text style={S.metaValue}>{totalHH}</Text></View>
       
        </View>

        {/* Stat boxes */}
        <View style={S.statsRow}>
          <View style={S.statBox}><Text style={S.statLabel}>Total inhabitants</Text><Text style={S.statValue}>{displayTotal}</Text></View>
          <View style={S.statBox}><Text style={S.statLabel}>Total male</Text><Text style={[S.statValue, S.blue]}>{ageM}</Text></View>
          <View style={S.statBox}><Text style={S.statLabel}>Total female</Text><Text style={[S.statValue, S.pink]}>{ageF}</Text></View>
        </View>

        {/* Age brackets */}
        <Text style={S.sectionTitle}>Population by age bracket</Text>
        <TableHeadCustom label="Age bracket" />
        <DataRows items={AGE_BRACKETS} data={ageData} />
        <TotalRow label="Total" m={ageM} f={ageF} />

        {/* Sectors */}
        <Text style={S.sectionTitle}>Population by sector</Text>
        <TableHeadCustom label="Sector" />
        <DataRows items={SECTORS} data={secData} />
        <TotalRow label="Total" m={secM} f={secF} />

        {/* Civil status & citizenship */}
        <Text style={S.sectionTitle}>Civil status & citizenship</Text>
        <TableHead />
        <SubHeader label="Civil status" />
        <DataRows items={CIVIL_STATUS} data={civData} />
        <TotalRow label="Civil status total" m={civM} f={civF} />
        <SubHeader label="Citizenship" />
        <DataRows items={CITIZENSHIP} data={citData} />
        <TotalRow label="Citizenship total" m={citM} f={citF} />
      </Page>
    </Document>
  )
}

// ─── auto-download helper ─────────────────────────────────────────────────────

async function downloadPdf(docProps) {
  const semLabel = docProps.semester === '1' ? '1st' : '2nd'
  const filename = `RBI-Form-C_${semLabel}-Sem_CY${docProps.year}_${docProps.barangay || 'Barangay'}.pdf`

  const blob = await pdf(<RbiPdfDocument {...docProps} />).toBlob()
  const url  = URL.createObjectURL(blob)
  const a    = document.createElement('a')
  a.href     = url
  a.download = filename
  a.click()
  URL.revokeObjectURL(url)
}

// ─── main component ───────────────────────────────────────────────────────────

export default function RbiFormC({ onDone }) {
  const currentYear = new Date().getFullYear()

  const [semester,   setSemester]   = useState('1')
  const [year,       setYear]       = useState(String(currentYear))
  const [region,     setRegion]     = useState('V')
  const [province,   setProvince]   = useState('Camarines Norte')
  const [cityMun,    setCityMun]    = useState('Daet')
  const [barangay,   setBarangay]   = useState('Lag-on')
  const [totalInhab, setTotalInhab] = useState(0)
  const [totalHH,    setTotalHH]    = useState(0)
  const [totalFam,   setTotalFam]   = useState(0)

  const [ageData, setAgeData] = useState(initAgeData())
  const [secData, setSecData] = useState(initSecData())
  const [civData, setCivData] = useState(initCivData())
  const [citData, setCitData] = useState(initCitData())

  const [status, setStatus] = useState('loading') // loading | ready | downloading | done | error
  const [errMsg, setErrMsg] = useState('')
  const didDownload = useRef(false)

  const ageM = AGE_BRACKETS.reduce((s, b) => s + (ageData[b.key]?.male   || 0), 0)
  const ageF = AGE_BRACKETS.reduce((s, b) => s + (ageData[b.key]?.female || 0), 0)
  const secM = SECTORS.reduce((s, b)      => s + (secData[b.key]?.male   || 0), 0)
  const secF = SECTORS.reduce((s, b)      => s + (secData[b.key]?.female || 0), 0)
  const civM = CIVIL_STATUS.reduce((s, b) => s + (civData[b.key]?.male   || 0), 0)
  const civF = CIVIL_STATUS.reduce((s, b) => s + (civData[b.key]?.female || 0), 0)
  const citM = CITIZENSHIP.reduce((s, b)  => s + (citData[b.key]?.male   || 0), 0)
  const citF = CITIZENSHIP.reduce((s, b)  => s + (citData[b.key]?.female || 0), 0)

  // ── fetch ──────────────────────────────────────────────────────────────────
  useEffect(() => {
    const load = async () => {
      try {
        const res  = await apiWithLoading.get('/residents/export/rbi')
        const d    = res.data
        const meta = d.meta || {}

        if (meta.totalInhabitants) setTotalInhab(meta.totalInhabitants)
        if (meta.totalHouseholds)  setTotalHH(meta.totalHouseholds)
        if (meta.totalFamilies)    setTotalFam(meta.totalFamilies)
        if (meta.semester)         setSemester(String(meta.semester))
        if (meta.year)             setYear(String(meta.year))

        const ageMap = {}
        ;(d.populationByAgeBracket || []).forEach(row => {
          ageMap[row.bracket?.toLowerCase()] = { male: row.male || 0, female: row.female || 0 }
        })
        setAgeData(prev => {
          const next = { ...prev }
          AGE_BRACKETS.forEach(b => { if (ageMap[b.key]) next[b.key] = ageMap[b.key] })
          return next
        })

        const sec = d.populationBySector || {}
        setSecData(prev => {
          const next = { ...prev }
          SECTORS.forEach(s => {
            if (sec[s.key]) next[s.key] = { male: sec[s.key].male || 0, female: sec[s.key].female || 0 }
          })
          return next
        })

        const cs = d.civilStatus || {}
        setCivData(prev => {
          const next = { ...prev }
          CIVIL_STATUS.forEach(c => {
            if (cs[c.key]) next[c.key] = { male: cs[c.key].male || 0, female: cs[c.key].female || 0 }
          })
          return next
        })

        const cit = d.citizenship || {}
        setCitData(prev => {
          const next = { ...prev }
          CITIZENSHIP.forEach(c => {
            if (cit[c.key]) next[c.key] = { male: cit[c.key].male || 0, female: cit[c.key].female || 0 }
          })
          return next
        })

        setStatus('ready')
      } catch (err) {
        setErrMsg(err?.response?.data?.message || err?.message || 'Could not reach API')
        setStatus('error')
      }
    }
    load()
  }, [])

  // ── auto-download once data is ready ──────────────────────────────────────
  useEffect(() => {
    if (status !== 'ready') return
    if (didDownload.current) return
    didDownload.current = true

    const docProps = {
      semester, year, region, province, cityMun, barangay,
      totalInhab, totalHH, totalFam,
      ageData, secData, civData, citData,
      ageM, ageF, secM, secF, civM, civF, citM, citF,
    }

    setStatus('downloading')
    downloadPdf(docProps)
      .then(() => {
        setStatus('done')
        setTimeout(() => onDone?.(), 1200) // brief pause so user sees the checkmark
      })
      .catch(err => {
        setErrMsg(err?.message || 'PDF generation failed')
        setStatus('error')
      })
  }, [status])

  // ── render — loading/status only, no form UI ──────────────────────────────
  return (
    <div className="flex flex-col items-center justify-center gap-3 py-20 text-muted-foreground">
      {status === 'error' ? (
        <Alert variant="destructive" className="max-w-sm">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>{errMsg}</AlertDescription>
        </Alert>
      ) : status === 'done' ? (
        <>
          <CheckCircle2 className="w-8 h-8 text-green-500" />
          <p className="text-sm font-medium text-green-600">PDF downloaded successfully!</p>
        </>
      ) : (
        <>
          <Loader2 className="w-6 h-6 animate-spin" />
          <p className="text-sm">
            {status === 'loading'     ? 'Fetching data…'      : 'Generating PDF…'}
          </p>
        </>
      )}
    </div>
  )
}
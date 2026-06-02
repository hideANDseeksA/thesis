import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

const steps = [
  {
    step: 1,
    title: "Visit the Barangay Health Center",
    description:
      "Go to the Barangay Lag-on Health Center and inform the Barangay Health Worker (BHW) or Midwife that you need a check-up. No prior appointment needed.",
    tag: "Patient",
    status: "required",
  },
  {
    step: 2,
    title: "Initial Assessment",
    description:
      "The BHW or Midwife will record your name, age, address, chief complaint, and vital signs such as blood pressure, temperature, and weight.",
    tag: "BHW / Midwife",
    status: "required",
  },
  {
    step: 3,
    title: "Issuance of Referral Slip",
    description:
      "Since Barangay Lag-on only refers patients, the BHW will prepare a Referral Slip containing your basic information and reason for referral. Do not lose this slip.",
    tag: "Referral",
    status: "important",
  },
  {
    step: 4,
    title: "Proceed to the Nearest RHU",
    description:
      "Go to the nearest Rural Health Unit and present your referral slip at the reception or OPD window. RHU hours are typically Monday–Friday, 8:00 AM – 5:00 PM.",
    tag: "At RHU",
    status: "required",
  },

];

const tagColors = {
  Patient: "bg-blue-100 text-blue-700",
  "BHW / Midwife": "bg-purple-100 text-purple-700",
  Referral: "bg-yellow-100 text-yellow-700",
  "At RHU": "bg-green-100 text-green-700",
  Consultation: "bg-teal-100 text-teal-700",
  "Follow-Up": "bg-orange-100 text-orange-700",
};

const stepCircleColors = {
  required: "bg-green-600 text-white",
  important: "bg-yellow-500 text-white",
  optional: "bg-gray-400 text-white",
};

export default function BarangayCheckupProcess() {
  return (
    <Card className="max-w-xl w-full">
      <CardHeader>
        <CardTitle className="text-base">
          Barangay Lag-on — Check-Up Process
        </CardTitle>
        <p className="text-sm text-muted-foreground">
          Step-by-step guide for patients seeking medical check-up and referral
          to the nearest RHU.
        </p>
      </CardHeader>
      <CardContent>
        <div className="flex flex-col">
          {steps.map((item, index) => (
            <div key={item.step} className="flex gap-4">
              {/* Step indicator + line */}
              <div className="flex flex-col items-center">
                <div
                  className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold shrink-0 ${stepCircleColors[item.status]}`}
                >
                  {item.step}
                </div>
                {index < steps.length - 1 && (
                  <div className="w-px flex-1 bg-border my-1 min-h-[20px]" />
                )}
              </div>

              {/* Content */}
              <div className={`flex-1 ${index < steps.length - 1 ? "pb-6" : "pb-0"}`}>
                <div className="flex items-center gap-2 mb-1 flex-wrap">
                  <span
                    className={`text-xs font-semibold px-2 py-0.5 rounded ${tagColors[item.tag]}`}
                  >
                    {item.tag}
                  </span>
                  {item.status === "important" && (
                    <Badge variant="outline" className="text-xs text-yellow-600 border-yellow-400">
                      Important
                    </Badge>
                  )}
                  {item.status === "optional" && (
                    <Badge variant="outline" className="text-xs text-gray-500">
                      If needed
                    </Badge>
                  )}
                </div>
                <p className="font-semibold text-sm mb-1">{item.title}</p>
                <p className="text-xs text-muted-foreground leading-relaxed">
                  {item.description}
                </p>
              </div>
            </div>
          ))}
        </div>

        {/* Emergency note */}
        <div className="mt-6 border border-red-200 bg-red-50 rounded-md px-4 py-3">
          <p className="text-xs font-semibold text-red-600 mb-0.5">🚨 Emergency?</p>
          <p className="text-xs text-red-500">
            For life-threatening emergencies, go directly to the nearest hospital
            or call <strong>911</strong>. Do not wait for a referral slip.
          </p>
        </div>
      </CardContent>
    </Card>
  );
}
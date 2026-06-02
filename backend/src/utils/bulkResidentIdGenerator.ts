import prisma from "../prisma"

interface BulkResidentIdOptions {
  count: number
}

export const generateBulkResidentIds = async ({
  count,
}: BulkResidentIdOptions): Promise<string[]> => {
  if (count <= 0) return []

  return prisma.$transaction(async (tx) => {
    let setting = await tx.system_setting.findFirst()

    // Initialize system setting if missing
    if (!setting) {
      setting = await tx.system_setting.create({
        data: {
          residentPrefix: "T-",
          residentNumberType: "sequential",
          residentNumberLength: 6,
          residentNumber: 0,
        },
      })
    }

    const {
      residentPrefix,
      residentNumber,
      residentNumberLength,
      residentNumberType,
      id,
    } = setting

    // RANDOM mode (no counter update)
    if (residentNumberType === "random") {
      const min = 10 ** (residentNumberLength - 1)
      const max = 10 ** residentNumberLength - 1

      const ids: string[] = []

      for (let i = 0; i < count; i++) {
        const randomNum =
          Math.floor(Math.random() * (max - min + 1)) + min
        ids.push(`${residentPrefix}${randomNum}`)
      }

      return ids
    }

    // SEQUENTIAL mode (atomic)
    const start = residentNumber + 1
    const end = residentNumber + count

    await tx.system_setting.update({
      where: { id },
      data: { residentNumber: end },
    })

    const ids: string[] = []

    for (let num = start; num <= end; num++) {
      const padded = String(num).padStart(residentNumberLength, "0")
      ids.push(`${residentPrefix}${padded}`)
    }

    return ids
  })
}

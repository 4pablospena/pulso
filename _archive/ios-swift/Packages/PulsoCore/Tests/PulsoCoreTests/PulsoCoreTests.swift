import Foundation
import Testing
@testable import PulsoCore

@Suite struct EnergyBudgetTests {
    @Test func bmrMatchesMifflin() {
        // 10·78 + 6.25·178 − 5·32 + 5
        #expect(BodyProfile.example.bmr == 1737.5)
    }

    @Test func activityRaisesTargetOneToOne() {
        let rest = EnergyBudget.target(profile: .example, activeKcal: 0, dayType: .normal)
        let trained = EnergyBudget.target(profile: .example, activeKcal: 500, dayType: .normal)
        #expect(trained.kcal - rest.kcal == 500)
    }

    @Test func macrosAddUpToKcal() {
        let t = EnergyBudget.target(profile: .example, activeKcal: 350, dayType: .highProtein)
        let fromMacros = t.protein * 4 + t.carbs * 4 + t.fat * 9
        #expect(abs(fromMacros - t.kcal) < 10)
        #expect(t.protein == (78 * 2.2).rounded())
    }
}

@Suite struct FastingTests {
    let start = Date(timeIntervalSince1970: 0)

    @Test func duringFast() {
        let s = FastingClock.status(start: start, protocol: .p16_8, now: start.addingTimeInterval(8 * 3600))
        #expect(s.phase == .fasting)
        #expect(s.progress == 0.5)
        #expect(s.remaining == 8 * 3600)
    }

    @Test func eatingWindowThenNextCycle() {
        let eating = FastingClock.status(start: start, protocol: .p16_8, now: start.addingTimeInterval(18 * 3600))
        #expect(eating.phase == .eating)
        #expect(eating.remaining == 6 * 3600)

        let nextDay = FastingClock.status(start: start, protocol: .p16_8, now: start.addingTimeInterval(25 * 3600))
        #expect(nextDay.phase == .fasting)
        #expect(nextDay.phaseEnd == start.addingTimeInterval(40 * 3600))
    }
}

@Suite struct StrengthTests {
    @Test func epley() {
        #expect(StrengthMath.estimatedOneRepMax(LoggedSet(reps: 10, weightKg: 60)) == 80)
        #expect(StrengthMath.estimatedOneRepMax(LoggedSet(reps: 1, weightKg: 100)) == 100)
    }

    @Test func rpeAddsRepsInReserve() {
        let atRPE8 = StrengthMath.estimatedOneRepMax(LoggedSet(reps: 8, weightKg: 60, rpe: 8))
        #expect(atRPE8 == StrengthMath.estimatedOneRepMax(LoggedSet(reps: 10, weightKg: 60)))
    }

    @Test func progressiveOverload() {
        #expect(StrengthMath.nextTarget(last: LoggedSet(reps: 12, weightKg: 50)) == LoggedSet(reps: 6, weightKg: 52.5))
        #expect(StrengthMath.nextTarget(last: LoggedSet(reps: 8, weightKg: 50)) == LoggedSet(reps: 9, weightKg: 50))
    }

    @Test func planRoutinesUseKnownExercises() {
        for name in WeeklyPlan.days.flatMap(\.routine) {
            #expect(ExerciseCatalog.named(name) != nil, "\(name) no está en el catálogo")
        }
    }
}

@Suite struct GroceryTests {
    @Test(arguments: [
        ("Pechuga de pollo", Aisle.meat),
        ("Queso fresco batido 0%", .dairy),
        ("Brócoli congelado", .frozen),
        ("Atún al natural en lata", .canned),
        ("Crema de cacahuete 100%", .nuts),
        ("Copos de avena integrales", .pantry),
        ("Plátano", .produce),
        ("Claras de huevo líquidas", .dairy),
        ("Algo raro", .other),
    ])
    func categorize(name: String, aisle: Aisle) {
        #expect(Aisle.categorize(name) == aisle)
    }

    @Test func weeklyListIsGroupedInStoreOrder() {
        let aisles = WeeklyPlan.weeklyGroceries.map(\.0)
        #expect(aisles == Aisle.allCases.filter(aisles.contains))
        #expect(!aisles.contains(.other))
    }

    @Test func mercadonaSearchURL() {
        #expect(MercadonaLink.search("Queso batido 0%")?.absoluteString
                == "https://tienda.mercadona.es/search-results?query=Queso%20batido%200%25")
    }

    @Test func paceFormatting() {
        #expect(RunFormat.pace(meters: 10_000, seconds: 3120) == "5:12 /km")
    }
}

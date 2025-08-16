import Link from 'next/link'

export default function Home() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
      <div className="container mx-auto px-4 py-16">
        <div className="text-center">
          <h1 className="text-4xl font-bold text-gray-900 mb-6">
            Property Portfolio Cashflow Forecaster
          </h1>
          <p className="text-xl text-gray-600 mb-8 max-w-2xl mx-auto">
            A comprehensive SaaS application that helps property investors forecast their portfolio cashflow 
            and identify the earliest year they can safely replace their income.
          </p>
          
          <div className="flex flex-col sm:flex-row gap-4 justify-center mb-12">
            <Link 
              href="/dashboard"
              className="bg-blue-600 hover:bg-blue-700 text-white font-semibold py-3 px-8 rounded-lg transition-colors"
            >
              View Dashboard
            </Link>
            <Link 
              href="/auth"
              className="bg-white hover:bg-gray-50 text-blue-600 font-semibold py-3 px-8 rounded-lg border-2 border-blue-600 transition-colors"
            >
              Sign In
            </Link>
          </div>

          <div className="grid md:grid-cols-3 gap-8 max-w-4xl mx-auto">
            <div className="bg-white p-6 rounded-lg shadow-md">
              <h3 className="text-lg font-semibold text-gray-900 mb-3">Portfolio Management</h3>
              <p className="text-gray-600">
                Create and manage property portfolios with up to 10 properties, each with detailed 
                financial modeling and strategy-specific calculations.
              </p>
            </div>
            
            <div className="bg-white p-6 rounded-lg shadow-md">
              <h3 className="text-lg font-semibold text-gray-900 mb-3">30-Year Projections</h3>
              <p className="text-gray-600">
                Comprehensive cashflow forecasting with tax calculations, loan amortization, 
                and strategy-specific effects like Manufacture Equity and Value-Add Commercial.
              </p>
            </div>
            
            <div className="bg-white p-6 rounded-lg shadow-md">
              <h3 className="text-lg font-semibold text-gray-900 mb-3">KPI Dashboard</h3>
              <p className="text-gray-600">
                Track key performance indicators including LVR, DSCR, and identify the 
                income-replacement year for your portfolio.
              </p>
            </div>
          </div>

          <div className="mt-12 p-6 bg-yellow-50 border border-yellow-200 rounded-lg max-w-2xl mx-auto">
            <p className="text-sm text-yellow-800">
              <strong>Disclaimer:</strong> This is general information and not financial advice. 
              Results are hypothetical and depend on the assumptions you enter.
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}

import { screen } from "@testing-library/dom"
import BillsUI from "../views/BillsUI.js"
import { bills } from "../fixtures/bills.js"

import { localStorageMock } from "../__mocks__/localStorage.js"
import Firestore from "../app/Firestore.js"
import { ROUTES, ROUTES_PATH } from "../constants/routes"
import Router from "../app/Router.js"
import Bills from "../containers/Bills.js"
import userEvent from "@testing-library/user-event"

import firebase from "../__mocks__/firebase.js";

describe("Given I am connected as an employee", () => {
  describe("When billsUi is call", () => {
    test("Then, it should render Loading ...", () => {
      const html = BillsUI({ data: [], loading: true })
      document.body.innerHTML = html
      expect(screen.getAllByText('Loading...')).toBeTruthy()
    })
    test("Then, it should render Error...", () => {
      const html = BillsUI({ data: [], loading: false, error: 'Error...' })
      document.body.innerHTML = html
      expect(screen.getAllByText('Error...')).toBeTruthy()
    })
  })
  describe("When I am on Bills Page", () => {
    test("Then bill icon in vertical layout should be highlighted", () => {
      // Définir l'utilisateur
      Object.defineProperty(window, 'localStorage', { value: localStorageMock })
      window.localStorage.setItem('user', JSON.stringify({
        type: 'Employee'
      }))

      //Modifier la méthode bills de Firestore
      Firestore.bills = () => ({ bills, get: jest.fn().mockResolvedValue('default') })

      //Définir le chemin de la page
      Object.defineProperty(window, 'location', { value: { hash: ROUTES_PATH['Bills'] } })

      document.body.innerHTML = `<div id='root'></div>`

      //Lancer la méthode Router() pour ajouter ou non la class active-icon
      Router()

      expect(screen.getByTestId("icon-window").classList.contains("active-icon")).toBeTruthy()
    })
    test("Then bills should be ordered from earliest to latest", () => {
      const html = BillsUI({ data: bills })
      document.body.innerHTML = html
      const dates = screen.getAllByText(/^(19|20)\d\d[- /.](0[1-9]|1[012])[- /.](0[1-9]|[12][0-9]|3[01])$/i).map(a => a.innerHTML)
      const antiChrono = (a, b) => ((a < b) ? 1 : -1)
      const datesSorted = [...dates].sort(antiChrono)
      expect(dates).toEqual(datesSorted)
    })

    describe("When I click on the eye icon view", () => {
      test("Then, It should open a modal", () => {
        $.fn.modal = jest.fn() //Corrige TypeError: $(...).modal is not a function
        // Définir user
        Object.defineProperty(window, 'localStorage', { value: localStorageMock })
        window.localStorage.setItem('user', JSON.stringify({
          type: 'Employee'
        }))
        
        //Définir onNavigate
        const onNavigate = (pathname) => {
          document.body.innerHTML = ROUTES({ pathname })
        }

        const html = BillsUI({data: bills})
        document.body.innerHTML = html
        
        const newBill = new Bills({
          document, onNavigate, firestore: null, localStorage: window.localStorage
        })

        const newEye = screen.getAllByTestId('icon-eye')
        const handleClickIconEye = jest.fn(newBill.handleClickIconEye(newEye[0]))

        newEye[0].addEventListener('click', handleClickIconEye)
        userEvent.click(newEye[0])
        expect(handleClickIconEye).toHaveBeenCalled()
      })
    })
    describe("When I click on the NewBill button", () => {
      test("Then, It should render NewBill page", () => {
        // Définir user
        Object.defineProperty(window, 'localStorage', { value: localStorageMock })
        window.localStorage.setItem('user', JSON.stringify({
          type: 'Employee'
        }))
        
        //Définir onNavigate
        const onNavigate = (pathname) => {
          document.body.innerHTML = ROUTES({ pathname })
        }

        const html = BillsUI({data: bills})
        document.body.innerHTML = html
        
        const newBill = new Bills({
          document, onNavigate, firestore: null, localStorage: window.localStorage
        })

        const newBillButton = screen.getByTestId('btn-new-bill')
        const handleClickNewBill = jest.fn(newBill.handleClickNewBill())

        newBillButton.addEventListener('click', handleClickNewBill)
        userEvent.click(newBillButton)
        expect(handleClickNewBill).toHaveBeenCalled()
      })
    })
  })
})

// test d'integration GET
describe("Given I am a user connected as Employee", () => {
  describe("When I navigate to Bills", () => {
    test("fetches bills from mock API GET", async () => {
      const getSpy = jest.spyOn(firebase, "get");
      const bills = await firebase.get();
      expect(getSpy).toHaveBeenCalledTimes(1);
      expect(bills.data.length).toBe(4);
    })
    test("fetches bills from an API and fails with 404 message error", async () => {
      firebase.get.mockImplementationOnce( () => 
        Promise.reject(new Error("Erreur 404"))
      )
      const html = BillsUI({ error: "Erreur 404" })
      document.body.innerHTML = html
      const message = await screen.getByText(/Erreur 404/)
      expect(message).toBeTruthy()
    })
    test("fetches messages from an API and fails with 500 message error", async () => {
      firebase.get.mockImplementationOnce( () => 
        Promise.reject(new Error("Erreur 500"))
      )
      const html = BillsUI({ error: "Erreur 500" })
      document.body.innerHTML = html
      const message = await screen.getByText(/Erreur 500/)
      expect(message).toBeTruthy()
    })
  })
})
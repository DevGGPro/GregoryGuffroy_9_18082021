import { createEvent, fireEvent, screen } from "@testing-library/dom"
import NewBillUI from "../views/NewBillUI.js"
import NewBill from "../containers/NewBill.js"

import { ROUTES } from "../constants/routes.js";
import { localStorageMock } from "../__mocks__/localStorage.js";

import firebase from '../__mocks__/firebase';
import BillsUI from "../views/BillsUI.js"


describe("Given I am connected as an employee", () => {
  describe("When I am on NewBill Page", () => {
    describe("When I choose a wrong extension file", () => {
      test("Then it should trigger on error message", () => {
        window.alert = jest.fn()
        // Définir user
        Object.defineProperty(window, 'localStorage', { value: localStorageMock })
        window.localStorage.setItem('user', JSON.stringify({
          type: 'Employee'
        }))
        //Définir onNavigate
        const onNavigate = (pathname) => {
          document.body.innerHTML = ROUTES({ pathname })
        }

        const html = NewBillUI()
        document.body.innerHTML = html

        const file = new File(['pdf'], 'test.pdf', {type: 'application/pdf'})
        const newBill = new NewBill({
          document,
          onNavigate,
          firestore: null,
          localStorage: window.localStorage
        })
        const inputFile = screen.getByTestId('file')

        const handleChangeFile = jest.fn(newBill.handleChangeFile)

        inputFile.addEventListener('input', handleChangeFile)
        fireEvent(inputFile, createEvent('input', inputFile, {target: {files: file}}))

        expect(handleChangeFile).toBeCalled()
        expect(window.alert).toHaveBeenCalledWith('Veuillez inserer un justificatif au format .jpg/.jpeg/.png')
      })
    })
    describe("When I choose a good extension file", () => {
      test("Then the file input should change", () => {
        // Définir user
        Object.defineProperty(window, 'localStorage', { value: localStorageMock })
        window.localStorage.setItem('user', JSON.stringify({
          type: 'Employee'
        }))
        //Définir onNavigate
        const onNavigate = (pathname) => {
          document.body.innerHTML = ROUTES({ pathname })
        }

        const html = NewBillUI()
        document.body.innerHTML = html

        const file = new File(['test'], 'test.jpg', {type: 'image/jpg'})
        const newBill = new NewBill({
          document,
          onNavigate,
          firestore: null,
          localStorage: window.localStorage
        })
        const inputFile = screen.getByTestId('file')

        const handleChangeFile = jest.fn(newBill.handleChangeFile)

        inputFile.addEventListener('change', handleChangeFile)
        fireEvent(inputFile, createEvent('change', inputFile, {target: {files: file}}))

        expect(handleChangeFile).toBeCalled()
        expect(inputFile.files.name).toBe('test.jpg');
      })
    })
    describe("When I submit the form with an image", () => {
      test("Then it should create a new bill and I should be redirected to the dashboard", () =>{
        // Définir user
        Object.defineProperty(window, 'localStorage', { value: localStorageMock })
        window.localStorage.setItem('user', JSON.stringify({
          type: 'Employee'
        }))
        //Définir onNavigate
        const onNavigate = (pathname) => {
          document.body.innerHTML = ROUTES({ pathname })
        }
        const html = NewBillUI()
        document.body.innerHTML = html
        
        const newBill = new NewBill({
          document,
          onNavigate,
          firestore: null,
          localStorage: window.localStorage
        })

        const submitButton = screen.getByTestId('form-new-bill');

        const handleSubmit = jest.fn(newBill.handleSubmit)

        submitButton.addEventListener('submit', handleSubmit)

        fireEvent.submit(submitButton)

        expect(handleSubmit).toBeCalled()
        expect(screen.getAllByText('Mes notes de frais')).toBeTruthy()
      })
    })
    
  })
})

// test d'integration POST
describe("Given I am a user connected as Employee", () => {
  describe("When I navigate to NewBill page", () => {
    describe("When I post a new bill", () => {
      test("fetches bills to mock API POST", async () => {
       const getSpy = jest.spyOn(firebase, "post")
       const bills = await firebase.post()
       expect(getSpy).toHaveBeenCalledTimes(1)
       expect(bills).toBe(200)
      })
      test("fetches bills to an API and fails with 404 message error", async () => {
        firebase.post.mockImplementationOnce(() =>
          Promise.reject(new Error("Erreur 404"))
        )
        const html = BillsUI({ error: "Erreur 404" })
        document.body.innerHTML = html
        const message = await screen.getByText(/Erreur 404/)
        expect(message).toBeTruthy()
      })
      test("fetches messages to an API and fails with 500 message error", async () => {
        firebase.post.mockImplementationOnce(() =>
          Promise.reject(new Error("Erreur 500"))
        )
        const html = BillsUI({ error: "Erreur 500" })
        document.body.innerHTML = html
        const message = await screen.getByText(/Erreur 500/)
        expect(message).toBeTruthy()
      })
    })
  })
})
